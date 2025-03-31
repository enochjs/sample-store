import React, { act } from 'react';
import { render, screen, fireEvent, renderHook } from '@testing-library/react';
import createStore from '../src/createStore';

describe('createStore', () => {
  // 基本状态和actions定义
  const initialState = {
    count: 0,
    user: {
      name: '',
      isLoggedIn: false
    }
  };

  const actions: any = {
    increment: (amount = 1) => (set: (partial: Partial<typeof initialState>, replace?: boolean) => void, state: typeof initialState) => {
      set({ count: state.count + amount });
    },
    decrement: (amount = 1) => (set: (partial: Partial<typeof initialState>, replace?: boolean) => void, state: typeof initialState) => {
      set({ count: state.count - amount });
    },
    setUser: (name: string, isLoggedIn: boolean) => (set: (partial: Partial<typeof initialState>, replace?: boolean) => void, state: typeof initialState) => {
      set({ user: { name, isLoggedIn } });
    },
    // 异步action示例
    fetchUser: (userId: string) => async (set: (partial: Partial<typeof initialState>, replace?: boolean) => void, state: typeof initialState) => {
      try {
        // 模拟API调用
        return Promise.resolve({ name: 'Test User', isLoggedIn: true })
          .then(user => {
            set({ user });
            return user;
          });
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    },
    // 测试替换整个状态
    resetState: () => (set: (partial: Partial<typeof initialState>, replace?: boolean) => void, state: typeof initialState) => {
      set(initialState, true);
    }
  };

  // 测试初始化store
  test('should initialize store with initial state', () => {
    const store = createStore(initialState, actions);
    expect(store.getState()).toEqual(initialState);
  });

  // 测试同步actions
  test('should update state with synchronous actions', () => {
    const store = createStore(initialState, actions);
    
    // 测试increment action
    store.getActions().increment();
    expect(store.getState().count).toBe(1);
    
    // 测试带参数的increment action
    store.getActions().increment(5);
    expect(store.getState().count).toBe(6);
    
    // 测试decrement action
    store.getActions().decrement(2);
    expect(store.getState().count).toBe(4);
    
    // 测试setUser action
    store.getActions().setUser('John', true);
    expect(store.getState().user).toEqual({ name: 'John', isLoggedIn: true });
  });

  // 测试异步actions
  test('should update state with asynchronous actions', async () => {
    const store = createStore(initialState, actions);
    
    // 测试fetchUser action
    await store.getActions().fetchUser('123');
    expect(store.getState().user).toEqual({ name: 'Test User', isLoggedIn: true });
  });

  // 测试替换整个状态
  test('should replace entire state', () => {
    const store = createStore({ ...initialState, count: 10 }, actions);
    
    // 验证初始状态已修改
    expect(store.getState().count).toBe(10);
    
    // 测试resetState action
    store.getActions().resetState();
    expect(store.getState()).toEqual(initialState);
  });

  // 测试订阅功能
  test('should notify subscribers when state changes', () => {
    const store = createStore(initialState, actions);
    const listener = jest.fn();
    
    // 添加订阅
    const unsubscribe = store.subscribe(listener);
    
    // 更新状态
    store.getActions().increment();
    expect(listener).toHaveBeenCalledTimes(1);
    
    // 再次更新状态
    store.getActions().setUser('Jane', true);
    expect(listener).toHaveBeenCalledTimes(2);
    
    // 取消订阅
    unsubscribe();
    
    // 更新状态，但监听器不应被调用
    store.getActions().increment();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  // 测试useStore hook
  test('useStore hook should return state and actions', () => {
    const store = createStore(initialState, actions);
    
    const { result } = renderHook(() => store.useStore());
    
    // 验证返回的state和actions
    expect(result.current[0]).toEqual(initialState);
    expect(typeof result.current[1].increment).toBe('function');
    expect(typeof result.current[1].decrement).toBe('function');
    expect(typeof result.current[1].setUser).toBe('function');
  });

  // 测试useStore hook与选择器
  test('useStore hook should work with selectors', () => {
    const store = createStore(initialState, actions);
    
    // 使用选择器只获取count
    const { result } = renderHook(() => store.useStore(state => state.count));
    
    // 验证选择器返回的值
    expect(result.current[0]).toBe(0);
    
    // 更新状态
    act(() => {
      result.current[1].increment();
    });
    
    // 验证选择器返回的值已更新
    expect(result.current[0]).toBe(1);
  });

  // 测试与React组件的集成
  test('should integrate with React components', () => {
    const store = createStore(initialState, actions);
    
    // 创建一个简单的计数器组件
    function Counter() {
      const [state, actions] = store.useStore();
      
      return (
        <div>
          <span data-testid="count">{state.count}</span>
          <button onClick={() => actions.increment()}>Increment</button>
          <button onClick={() => actions.decrement()}>Decrement</button>
        </div>
      );
    }
    
    // 渲染组件
    render(<Counter />);
    
    // 验证初始计数
    expect(screen.getByTestId('count').textContent).toBe('0');
    
    // 点击increment按钮
    fireEvent.click(screen.getByText('Increment'));
    
    // 验证计数已更新
    expect(screen.getByTestId('count').textContent).toBe('1');
    
    // 点击decrement按钮
    fireEvent.click(screen.getByText('Decrement'));
    
    // 验证计数已更新
    expect(screen.getByTestId('count').textContent).toBe('0');
  });
});