import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Platform, DynamicColorIOS } from 'react-native';

export default function TabsLayout() {
  return (
    <NativeTabs
      labelStyle={{
        // Dynamic text color for liquid glass dark/light mode on iOS
        color: Platform.OS === 'ios' ? DynamicColorIOS({ dark: 'white', light: 'black' }) : 'black',
      }}
      tintColor={Platform.OS === 'ios' ? DynamicColorIOS({ dark: '#84cc16', light: '#4d7c0f' }) : '#84cc16'}
    >
      <NativeTabs.Trigger name="ideas">
        <NativeTabs.Trigger.Icon 
          sf={{ default: 'lightbulb', selected: 'lightbulb.fill' }} 
          md="lightbulb" 
        />
        <NativeTabs.Trigger.Label>Ideas</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="schedule">
        <NativeTabs.Trigger.Icon 
          sf={{ default: 'calendar', selected: 'calendar' }} 
          md="calendar_month" 
        />
        <NativeTabs.Trigger.Label>Schedule</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="dashboard">
        <NativeTabs.Trigger.Icon 
          sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }} 
          md="bar_chart" 
        />
        <NativeTabs.Trigger.Label>Dash</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="billing">
        <NativeTabs.Trigger.Icon 
          sf={{ default: 'creditcard', selected: 'creditcard.fill' }} 
          md="credit_card" 
        />
        <NativeTabs.Trigger.Label>Billing</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Icon 
          sf={{ default: 'gearshape', selected: 'gearshape.fill' }} 
          md="settings" 
        />
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
