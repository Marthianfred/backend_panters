export const mockHandler = jest.fn(() => Promise.resolve(true));
export const toNodeHandler = jest.fn(() => mockHandler);
export const fromNodeHeaders = jest.fn(() => ({}));
export const auth = {
  api: {
    getSession: jest.fn(() =>
      Promise.resolve({
        session: { userId: 'test-user' },
        user: { id: 'test-user' },
      }),
    ),
  },
};
