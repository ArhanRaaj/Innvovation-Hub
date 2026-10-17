// ============================================================================
// THE INNOVATION HUB - AUTHENTICATION & MULTI-TENANT ISOLATION SERVICE
// Provides client-side user accounts, credential validation, demo access,
// and strictly per-account isolation for created projects & AI studio sessions.
// ============================================================================

import { AuthUser, ScienceProject } from '../types.ts';

export interface StoredUserAccount extends AuthUser {
  passwordHash: string; // Base64 or hash for local client demo auth
}

const USERS_STORAGE_KEY = 'ih_users_database';
const ACTIVE_USER_KEY = 'ih_current_active_user';

// Built-in Demo Founder & Lead Architect Account
export const DEMO_USER: StoredUserAccount = {
  id: 'user-arhanraaj-founder',
  name: 'Arhan Raaj',
  email: 'arhan@innovationhub.io',
  avatar: 'assets/arhanraaj-pfp.jpg',
  role: 'Lead Hardware Architect / Founder',
  createdAt: 1718000000000,
  passwordHash: btoa('password123')
};

class AuthService {
  private activeUser: AuthUser | null = null;
  private listeners: Set<(user: AuthUser | null) => void> = new Set();

  constructor() {
    this.initDatabase();
    this.loadActiveUser();
  }

  private initDatabase(): void {
    try {
      const existing = localStorage.getItem(USERS_STORAGE_KEY);
      if (!existing) {
        const initialUsers: StoredUserAccount[] = [DEMO_USER];
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
      } else {
        const users: StoredUserAccount[] = JSON.parse(existing);
        // Ensure founder account exists
        if (!users.some(u => u.email.toLowerCase() === DEMO_USER.email.toLowerCase())) {
          users.push(DEMO_USER);
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        }
      }
    } catch (e) {
      console.error('Failed to init auth database:', e);
    }
  }

  private loadActiveUser(): void {
    try {
      const saved = localStorage.getItem(ACTIVE_USER_KEY);
      if (saved) {
        this.activeUser = JSON.parse(saved);
      } else {
        // Default to demo account on first visit so user has immediate personalized access
        this.activeUser = {
          id: DEMO_USER.id,
          name: DEMO_USER.name,
          email: DEMO_USER.email,
          avatar: DEMO_USER.avatar,
          role: DEMO_USER.role,
          createdAt: DEMO_USER.createdAt
        };
        localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(this.activeUser));
      }
    } catch {
      this.activeUser = null;
    }
  }

  private getUsers(): StoredUserAccount[] {
    try {
      const data = localStorage.getItem(USERS_STORAGE_KEY);
      return data ? JSON.parse(data) : [DEMO_USER];
    } catch {
      return [DEMO_USER];
    }
  }

  private saveUsers(users: StoredUserAccount[]): void {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users database:', e);
    }
  }

  public getCurrentUser(): AuthUser | null {
    return this.activeUser;
  }

  public onAuthStateChanged(cb: (user: AuthUser | null) => void): () => void {
    this.listeners.add(cb);
    cb(this.activeUser);
    return () => this.listeners.delete(cb);
  }

  private notifyListeners(): void {
    this.listeners.forEach(cb => {
      try {
        cb(this.activeUser);
      } catch (e) {
        console.error('Auth state listener error:', e);
      }
    });
  }

  public login(email: string, password: string): { success: boolean; user?: AuthUser; error?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const users = this.getUsers();
    const found = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!found) {
      return { success: false, error: 'No account registered with this email.' };
    }

    if (found.passwordHash !== btoa(password)) {
      return { success: false, error: 'Incorrect password for this account.' };
    }

    const authUser: AuthUser = {
      id: found.id,
      name: found.name,
      email: found.email,
      avatar: found.avatar,
      role: found.role,
      createdAt: found.createdAt
    };

    this.activeUser = authUser;
    localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(authUser));
    this.notifyListeners();
    return { success: true, user: authUser };
  }

  public register(name: string, email: string, password: string): { success: boolean; user?: AuthUser; error?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanName) {
      return { success: false, error: 'Please enter your full name.' };
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const users = this.getUsers();
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'An account with this email already exists. Try signing in.' };
    }

    const newUser: StoredUserAccount = {
      id: 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      name: cleanName,
      email: cleanEmail,
      avatar: '',
      role: 'Hardware Engineer',
      createdAt: Date.now(),
      passwordHash: btoa(password)
    };

    users.push(newUser);
    this.saveUsers(users);

    const authUser: AuthUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      avatar: newUser.avatar,
      role: newUser.role,
      createdAt: newUser.createdAt
    };

    this.activeUser = authUser;
    localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(authUser));
    this.notifyListeners();
    return { success: true, user: authUser };
  }

  public loginAsDemo(): AuthUser {
    const authUser: AuthUser = {
      id: DEMO_USER.id,
      name: DEMO_USER.name,
      email: DEMO_USER.email,
      avatar: DEMO_USER.avatar,
      role: DEMO_USER.role,
      createdAt: DEMO_USER.createdAt
    };
    this.activeUser = authUser;
    localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(authUser));
    this.notifyListeners();
    return authUser;
  }

  public logout(): void {
    this.activeUser = null;
    localStorage.removeItem(ACTIVE_USER_KEY);
    this.notifyListeners();
  }

  // ==========================================================================
  // PER-ACCOUNT PROJECT ISOLATION METHODS
  // Ensures User A only sees User A's projects, and User B only sees User B's!
  // ==========================================================================
  private getProjectStorageKey(userId?: string): string {
    const uid = userId || this.activeUser?.id || 'guest';
    return `ih_projects_${uid}`;
  }

  public getUserProjects(userId?: string): ScienceProject[] {
    try {
      const key = this.getProjectStorageKey(userId);
      const data = localStorage.getItem(key);
      if (!data) return [];
      const parsed: ScienceProject[] = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Error fetching user projects:', e);
      return [];
    }
  }

  public saveUserProject(project: ScienceProject, userId?: string): void {
    try {
      const uid = userId || this.activeUser?.id || 'guest';
      const key = this.getProjectStorageKey(uid);
      const currentProjects = this.getUserProjects(uid);

      // Ensure project has ownership tagged
      const enriched: ScienceProject = {
        ...project,
        userId: uid,
        authorName: this.activeUser?.name || 'Local Builder',
        createdAt: project.createdAt || Date.now()
      };

      const existingIndex = currentProjects.findIndex(p => p.id === enriched.id);
      if (existingIndex >= 0) {
        currentProjects[existingIndex] = enriched;
      } else {
        currentProjects.unshift(enriched);
      }

      localStorage.setItem(key, JSON.stringify(currentProjects));
    } catch (e) {
      console.error('Error saving user project:', e);
    }
  }

  public deleteUserProject(projectId: string, userId?: string): boolean {
    try {
      const uid = userId || this.activeUser?.id || 'guest';
      const key = this.getProjectStorageKey(uid);
      let currentProjects = this.getUserProjects(uid);
      const initialLen = currentProjects.length;
      currentProjects = currentProjects.filter(p => p.id !== projectId);
      localStorage.setItem(key, JSON.stringify(currentProjects));
      return currentProjects.length < initialLen;
    } catch (e) {
      console.error('Error deleting user project:', e);
      return false;
    }
  }

  // ==========================================================================
  // PER-ACCOUNT AI CHAT SESSIONS ISOLATION METHODS
  // Ensures User A only sees User A's AI chats, and User B only sees User B's!
  // ==========================================================================
  private getSessionStorageKey(userId?: string): string {
    const uid = userId || this.activeUser?.id || 'guest';
    return `ih_sessions_${uid}`;
  }

  private getFolderStorageKey(userId?: string): string {
    const uid = userId || this.activeUser?.id || 'guest';
    return `ih_folders_${uid}`;
  }

  public getUserSessions(userId?: string): any[] {
    try {
      const key = this.getSessionStorageKey(userId);
      const data = localStorage.getItem(key);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Error fetching user sessions:', e);
      return [];
    }
  }

  public saveUserSessions(sessions: any[], userId?: string): void {
    try {
      const uid = userId || this.activeUser?.id || 'guest';
      const key = this.getSessionStorageKey(uid);
      localStorage.setItem(key, JSON.stringify(sessions));
    } catch (e) {
      console.error('Error saving user sessions:', e);
    }
  }

  public getUserFolders(userId?: string): any[] {
    try {
      const key = this.getFolderStorageKey(userId);
      const data = localStorage.getItem(key);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Error fetching user folders:', e);
      return [];
    }
  }

  public saveUserFolders(folders: any[], userId?: string): void {
    try {
      const uid = userId || this.activeUser?.id || 'guest';
      const key = this.getFolderStorageKey(uid);
      localStorage.setItem(key, JSON.stringify(folders));
    } catch (e) {
      console.error('Error saving user folders:', e);
    }
  }
}

export const authService = new AuthService();
