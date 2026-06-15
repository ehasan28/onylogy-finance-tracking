import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';

import { BottomBar, CenterAddButton, TabItem } from '@/components/bottom-tab-bar';

export default function TabsLayout() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <BottomBar>
          <TabTrigger name="dashboard" href="/" asChild>
            <TabItem icon="home" label="Home" />
          </TabTrigger>
          <TabTrigger name="transactions" href="/transactions" asChild>
            <TabItem icon="receipt" label="History" />
          </TabTrigger>

          <CenterAddButton />

          <TabTrigger name="reports" href="/reports" asChild>
            <TabItem icon="stats-chart" label="Reports" />
          </TabTrigger>
          <TabTrigger name="settings" href="/settings" asChild>
            <TabItem icon="settings" label="Settings" />
          </TabTrigger>
        </BottomBar>
      </TabList>
    </Tabs>
  );
}
