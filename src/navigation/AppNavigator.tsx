import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { AddExpenseScreen } from '../screens/AddExpenseScreen';
import { CategoryManagementScreen } from '../screens/CategoryManagementScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { EditExpenseScreen } from '../screens/EditExpenseScreen';
import { ExpenseListScreen } from '../screens/ExpenseListScreen';
import { HouseholdSetupScreen } from '../screens/HouseholdSetupScreen';
import { JoinHouseholdScreen } from '../screens/JoinHouseholdScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import type {
  AuthStackParamList,
  ExpensesStackParamList,
  HouseholdStackParamList,
  MainTabParamList,
} from '../types/navigation';
import { colors } from '../utils/theme';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const HouseholdStack = createNativeStackNavigator<HouseholdStackParamList>();
const ExpenseStack = createNativeStackNavigator<ExpensesStackParamList>();
const Tabs = createBottomTabNavigator<MainTabParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen component={LoginScreen} name="Login" />
      <AuthStack.Screen component={RegisterScreen} name="Register" />
    </AuthStack.Navigator>
  );
}

function HouseholdNavigator() {
  return (
    <HouseholdStack.Navigator screenOptions={{ headerShown: false }}>
      <HouseholdStack.Screen component={HouseholdSetupScreen} name="HouseholdSetup" />
      <HouseholdStack.Screen component={JoinHouseholdScreen} name="JoinHousehold" />
    </HouseholdStack.Navigator>
  );
}

function ExpensesNavigator() {
  return (
    <ExpenseStack.Navigator
      screenOptions={{
        headerBackTitle: 'Expenses',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
      }}
    >
      <ExpenseStack.Screen
        component={ExpenseListScreen}
        name="ExpenseList"
        options={{ headerShown: false }}
      />
      <ExpenseStack.Screen
        component={EditExpenseScreen}
        name="EditExpense"
        options={{ title: 'Edit expense' }}
      />
    </ExpenseStack.Navigator>
  );
}

const icons: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Dashboard: 'pie-chart-outline',
  Expenses: 'receipt-outline',
  AddExpense: 'add-circle-outline',
  Categories: 'pricetags-outline',
  Settings: 'settings-outline',
};

function MainNavigator() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: { borderTopColor: colors.border, height: 84, paddingTop: 7 },
        tabBarIcon: ({ color, size }) => (
          <Ionicons color={color} name={icons[route.name]} size={size} />
        ),
      })}
    >
      <Tabs.Screen component={DashboardScreen} name="Dashboard" />
      <Tabs.Screen component={ExpensesNavigator} name="Expenses" />
      <Tabs.Screen
        component={AddExpenseScreen}
        name="AddExpense"
        options={{ title: 'Add' }}
      />
      <Tabs.Screen component={CategoryManagementScreen} name="Categories" />
      <Tabs.Screen component={SettingsScreen} name="Settings" />
    </Tabs.Navigator>
  );
}

export function AppNavigator() {
  const { user, profile } = useAuth();
  if (!user) return <AuthNavigator />;
  if (!profile?.householdId) return <HouseholdNavigator />;
  return <MainNavigator />;
}
