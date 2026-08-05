import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

interface TopbarRefreshState {
  onRefresh: (() => void) | null;
  isRefreshing: boolean;
  lastUpdated: number | null;
}

interface TopbarActionsContextValue extends TopbarRefreshState {
  registerRefresh: (state: TopbarRefreshState) => void;
  clearRefresh: () => void;
}

const DEFAULT_STATE: TopbarRefreshState = {
  onRefresh: null,
  isRefreshing: false,
  lastUpdated: null,
};

const TopbarActionsContext = createContext<TopbarActionsContextValue>({
  ...DEFAULT_STATE,
  registerRefresh: () => {},
  clearRefresh: () => {},
});

/**
 * The topbar is global, but "refresh this data" only makes sense in the
 * context of whatever page is currently showing. Rather than hardcoding the
 * dashboard's query keys into the topbar, pages register their own refresh
 * behavior here and the topbar just renders whatever is currently active --
 * so it stays correct if a page other than the dashboard ever wants a
 * refresh control, without the topbar knowing anything about that page.
 */
export function TopbarActionsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TopbarRefreshState>(DEFAULT_STATE);

  const value = useMemo<TopbarActionsContextValue>(
    () => ({
      ...state,
      registerRefresh: setState,
      clearRefresh: () => setState(DEFAULT_STATE),
    }),
    [state]
  );

  return <TopbarActionsContext.Provider value={value}>{children}</TopbarActionsContext.Provider>;
}

export function useTopbarActions() {
  return useContext(TopbarActionsContext);
}

export function useRegisterTopbarRefresh(state: TopbarRefreshState) {
  const { registerRefresh, clearRefresh } = useTopbarActions();
  const { onRefresh, isRefreshing, lastUpdated } = state;

  useEffect(() => {
    registerRefresh({ onRefresh, isRefreshing, lastUpdated });
    return clearRefresh;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRefresh, isRefreshing, lastUpdated]);
}
