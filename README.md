# Sample Store

A lightweight and efficient state management library for React applications.

## Installation

```bash
npm install sample-store
# or
yarn add sample-store
```

## Features

- Simple and intuitive API (简单直观的API)
- TypeScript support (TypeScript支持)
- Lightweight with minimal dependencies (轻量级，依赖少)
- React hooks integration (React钩子集成)
- Efficient state updates with shallow comparison (使用浅比较的高效状态更新)

## Usage

```tsx
import createStore from 'sample-store';

// Define your initial state
const initialState = {
  count: 0,
  user: {
    name: '',
    isLoggedIn: false
  }
};

// Define your actions
const actions = {
  increment: (amount = 1) => (set, state) => {
    set({ count: state.count + amount });
  },
  decrement: (amount = 1) => (set, state) => {
    set({ count: state.count - amount });
  },
  setUser: (name, isLoggedIn) => (set) => {
    set({ user: { name, isLoggedIn } });
  },
  // Async action example
  fetchUser: (userId) => async (set) => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      const user = await response.json();
      set({ user });
      return user;
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  }
};

// Create the store
const store = createStore(initialState, actions);

// In your React component
function Counter() {
  // Use the entire state
  const [state, actions] = store.useStore();
  
  // Or use a selector for better performance
  const [count, actions] = store.useStore(state => state.count);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => actions.increment()}>Increment</button>
      <button onClick={() => actions.decrement()}>Decrement</button>
    </div>
  );
}

function UserProfile() {
  // Use a selector to get only the user part of the state
  const [user, actions] = store.useStore(state => state.user);
  
  return (
    <div>
      {user.isLoggedIn ? (
        <p>Welcome, {user.name}!</p>
      ) : (
        <button onClick={() => actions.setUser('John Doe', true)}>
          Log in
        </button>
      )}
    </div>
  );
}
```

## API Reference

### `createStore(initialState, actions)`

Creates a new store with the given initial state and actions.

#### Parameters

- `initialState`: The initial state of the store.
- `actions`: An object containing action creators.

#### Returns

A store object with the following methods:

- `useStore(selector?)`: React hook to access the store state and actions.
- `getState()`: Get the current state.
- `getActions()`: Get the actions.
- `subscribe(listener)`: Subscribe to state changes.

## License

ISC