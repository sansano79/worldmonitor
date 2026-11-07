import './style.css';
import { mountCsm } from './shell';
import { ensureWmSession, installWmSessionFetchInterceptor } from '@/services/wm-session';
import { isDesktopRuntime } from '@/services/runtime';

const root = document.getElementById('app');
if (!root) throw new Error('CSM root is missing');

// The standalone CSM entry bypasses App.init(), where browser API access is
// normally initialized. Install the same anonymous technical session for the
// protected public-data RPCs used by GDELT and Telegram. This is not a user or
// Pro login; the server still validates the short-lived HttpOnly session.
if (!isDesktopRuntime()) {
  installWmSessionFetchInterceptor();
  void ensureWmSession().catch(() => false);
}

mountCsm(root);
