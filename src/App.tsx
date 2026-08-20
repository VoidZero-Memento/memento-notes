import { ReposProvider } from "@/lib/github/ReposContext";
import { AppShell } from "@/components/layout/AppShell";
import { KeepAliveRoutes } from "@/components/layout/KeepAliveRoutes";
import { SiteGate } from "@/components/layout/SiteGate";

const App = () => (
  <AppShell>
    <SiteGate>
      <ReposProvider>
        <KeepAliveRoutes />
      </ReposProvider>
    </SiteGate>
  </AppShell>
);

export default App;
