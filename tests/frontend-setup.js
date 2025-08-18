/**
 * Setup para testes de componentes React
 */

import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

// Mock Supabase client para frontend
global.mockSupabaseClient = {
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' } }
    }),
    signOut: jest.fn().mockResolvedValue({ error: null })
  },
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn().mockReturnThis()
};

// Mock do módulo Supabase
jest.unstable_mockModule('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => global.mockSupabaseClient)
}));

// Mock React Router
jest.unstable_mockModule('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(() => jest.fn()),
  useLocation: jest.fn(() => ({ pathname: '/' })),
  useParams: jest.fn(() => ({}))
}));

// Mock Zustand stores
jest.unstable_mockModule('../src/contexts/ClinicContext', () => ({
  useClinic: jest.fn(() => ({
    selectedClinic: {
      id: 'test-clinic',
      name: 'Clínica Teste'
    },
    selectClinic: jest.fn()
  }))
}));

// Mock toast
global.mockToast = jest.fn();
jest.unstable_mockModule('../src/hooks/use-toast', () => ({
  useToast: jest.fn(() => ({
    toast: global.mockToast
  }))
}));

// Setup environment para testes
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

export default {};
