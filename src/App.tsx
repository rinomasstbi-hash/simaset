/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppProvider } from './store/AppContext';
import AppLayout from './components/layout/AppLayout';

export default function App() {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
}
