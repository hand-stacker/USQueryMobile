import { ApolloProvider } from "@apollo/client/react";
import { Ionicons } from '@expo/vector-icons';
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
    NavigationContainer,
    NavigationIndependentTree
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Notifications from "expo-notifications";
import { useContext, useEffect } from "react";

import { client } from "./api/apollo";
import { navigate, navigationRef } from "./navigation/navigationRef";

import BillInfo from "./bill/screens/[bill_id]";
import BillFYP from "./bill/screens/bill_fyp";
import BillChatScreen from "./bill/screens/bill_chat";
import VotePredictionsScreen from "./bill/screens/vote_predictions";
import StarredBills from "./bill/screens/starred_bills";
import MemberInfo from "./member/screens/[membershipId]";
import DisclaimerModal from './misc/DisclaimerModal';
import PrivacyPolicyModal from './misc/PrivacyPolicyModal';
import ReviewModal from './misc/ReviewModal';
import UpdateAvailableModal from './misc/UpdateAvailableModal';
import UpsellModal from './misc/UpsellModal';
import WelcomeFavoritesModal from './misc/WelcomeFavoritesModal';
import WhatsNewModal from './misc/WhatsNewModal';
import VoteInfo from "./vote/screens/[vote_id]";
import VoteFYP from "./vote/screens/vote_fyp";

import { Tinos_400Regular, Tinos_700Bold, useFonts } from '@expo-google-fonts/tinos';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Login from "./auth/login";
import ResetPassword from "./auth/password_reset";
import RegisterAccount from "./auth/register";
import VerifyEmail from "./auth/verify";
import BillSearchResults from "./bill/screens/searched_bills";
import { UnscalableText } from './components/UnscalableText';
import './globals.css';
import SearchedMembers from "./member/screens/searched_members";
import StarredMembers from "./member/screens/starred_members";
import CheckoutSuccess from "./misc/checkout_success";
import FeedbackScreen from "./misc/feedback";
import NotificationSettings from "./misc/notification_settings";
import OptionsPage from "./misc/options";
import PlansScreen from "./misc/plans";
import VoteSearchResults from "./vote/screens/searched_votes";

import { GOOGLE_CLIENT_ID } from "../constants/auth";

const Tabs = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function SharedStack({ route } : {route:any}) {
  const initialRoute = route.params?.initialRoute;

  return (
    <Stack.Navigator initialRouteName={initialRoute}>
      <Stack.Screen name="Bill_FYP" component={BillFYP} options={{ headerShown: false }}/>
      <Stack.Screen name="Starred_Bills" component={StarredBills} options={{ headerShown: false }} />
      <Stack.Screen name="Searched_Bills" component={BillSearchResults} options={{ headerShown: false }}/>
      <Stack.Screen name="Bill_info" component={BillInfo} options={{ headerShown: false }}/>
      <Stack.Screen name="Vote_Predictions" component={VotePredictionsScreen} options={{ headerShown: false }}/>
      <Stack.Screen name="Bill_Chat" component={BillChatScreen} options={{ headerShown: false }}/>
      <Stack.Screen name="Starred_Members" component={StarredMembers} options={{ headerShown: false }}/>
      <Stack.Screen name="Searched_Members" component={SearchedMembers} options={{ headerShown: false }}/>
      <Stack.Screen name="Member_info" component={MemberInfo} options={{ headerShown: false }}/>
      <Stack.Screen name="Vote_FYP" component={VoteFYP} options={{ headerShown: false }}/>
      <Stack.Screen name="Searched_Votes" component={VoteSearchResults} options={{ headerShown: false }}/>
      <Stack.Screen name="Vote_info" component={VoteInfo} options={{ headerShown: false }}/>
      <Stack.Screen name="Options_screen" component={OptionsPage} options={{ headerShown: false }}/>
      <Stack.Screen name="Login" component={Login} options={{ headerShown: false }}/>
      <Stack.Screen name="Register" component={RegisterAccount} options={{ headerShown: false }}/>
      <Stack.Screen name="Verify" component={VerifyEmail} options={{ headerShown: false }}/>
      <Stack.Screen name="Reset_Password" component={ResetPassword} options={{ headerShown: false }}/>
      <Stack.Screen name="Notification_Settings" component={NotificationSettings} options={{ headerShown: false }}/>
      <Stack.Screen name="Privacy_Policy" component={PrivacyPolicy} options={{ headerShown: false }}/>
      <Stack.Screen name="Feedback" component={FeedbackScreen} options={{ headerShown: false }}/>
      <Stack.Screen name="Plans" component={PlansScreen} options={{ headerShown: false }}/>
      <Stack.Screen name="Checkout_Success" component={CheckoutSuccess} options={{ headerShown: false }}/>
    </Stack.Navigator>
  );
}

function TabNavigator() {
  const { theme } = useContext(ThemeContext);
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabBarHeight = Platform.OS === 'ios'
    ? 50 + insets.bottom
    : Math.round(windowHeight * 0.14);
  return (
    <Tabs.Navigator
      initialRouteName="Bills"
      screenOptions={({ route }) => ({
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          height: tabBarHeight,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : undefined,
        },
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.titleText,
        tabBarIcon: ({ color, size }) => {
          const name =
            route.name === 'Bills' ? 'newspaper-outline' :
            route.name === 'Members' ? 'people-outline' :
            route.name === 'Votes' ? 'checkmark-done-outline' :
            route.name === 'Settings' ? 'options-outline' :
            'ellipse-outline';
          return <Ionicons name={name as any} size={size} color={color} />;
        },
      })}
      >
      <Tabs.Screen
        name="Bills"
        component={SharedStack}
        initialParams={{ initialRoute: "Bill_FYP" }}
        listeners={({ navigation, route }) => ({
          tabPress: (e: any) => {
            e.preventDefault();
            (navigation as any).navigate(route.name, { screen: (route.params as any).initialRoute });
          },
        })}
        options={{
          headerShown: false,
          tabBarLabel: ({ color }) => <UnscalableText style={[{ color }, { fontSize: 12 }]}>Bills</UnscalableText>
      }}
      />
      <Tabs.Screen
        name="Members"
        component={SharedStack}
        initialParams={{ initialRoute: "Starred_Members" }}
        listeners={({ navigation, route }) => ({
          tabPress: (e: any) => {
            e.preventDefault();
            (navigation as any).navigate(route.name, { screen: (route.params as any).initialRoute });
          },
        })}
        options={{
          headerShown: false,
          tabBarLabel: ({ color }) => <UnscalableText style={[{ color }, { fontSize: 12 }]}>Members</UnscalableText>
        }}
      />
      <Tabs.Screen
        name="Votes"
        component={SharedStack}
        initialParams={{ initialRoute: "Vote_FYP" }}
        listeners={({ navigation, route }) => ({
          tabPress: (e: any) => {
            e.preventDefault();
            (navigation as any).navigate(route.name, { screen: (route.params as any).initialRoute });
          },
        })}
        options={{
          headerShown: false,
          tabBarLabel: ({ color }) => <UnscalableText style={[{ color }, { fontSize: 12 }]}>Votes</UnscalableText>
        }}
      />
      <Tabs.Screen
        name="Settings"
        component={SharedStack}
        initialParams={{ initialRoute: "Options_screen" }}
        listeners={({ navigation, route }) => ({
          tabPress: (e: any) => {
            e.preventDefault();
            (navigation as any).navigate(route.name, { screen: (route.params as any).initialRoute });
          },
        })}
        options={{
          headerShown: false,
          tabBarLabel: ({ color }) => <UnscalableText style={[{ color }, { fontSize: 12 }]}>Settings</UnscalableText>
        }}
      />
    </Tabs.Navigator>
  );
}

import { ThemeContext, ThemeProvider } from "./theme/themeContext";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Tinos_400Regular,
    Tinos_700Bold,
  });
  useEffect(() => {
    const sub =
      Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data;
        if (data?.screen === 'Bill_Search') {
          const typeMap: Record<string, string> = { House: '!H', Senate: '!S' };
          const bill_type = typeMap[(data.filters as any)?.type] ?? '!';
          navigate('Searched_Bills', {
            sort: data.sort ?? 'datedesc',
            bill_type,
            highlight: data.highlight ?? [],
          });
        } else if (data?.screen === "Bill_FYP") {
          navigate("Bill_FYP", { sort: data.sort ?? "datedesc" });
        } else if (data?.bill_id) {
          navigate("Bill_info", { bill_id: data.bill_id });
        }
      });

    return () => sub.remove();
  }, []);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_CLIENT_ID,
      offlineAccess: true,
    });
  }, []);

  if (!fontsLoaded) return null;

  return (
    <ApolloProvider client={client}>
      <ThemeProvider>
        <AppNavigation />
      </ThemeProvider>
    </ApolloProvider>
  );
}

function AppNavigation() {
  const { theme } = useContext(ThemeContext);
  const navTheme = createNavTheme(theme);
  return (
    <NavigationIndependentTree>
      <SafeAreaProvider>
      <NavigationContainer ref={navigationRef} theme={navTheme}>
        <TabNavigator />
        <WelcomeFavoritesModal />
        <PrivacyPolicyModal />
        <DisclaimerModal />
        <ReviewModal />
        <WhatsNewModal />
        <UpdateAvailableModal />
        <UpsellModal />
      </NavigationContainer>
      </SafeAreaProvider>
    </NavigationIndependentTree>
  );
}

import { DefaultTheme, DarkTheme as NavDarkTheme } from "@react-navigation/native";
import { Platform, useWindowDimensions } from "react-native";
import PrivacyPolicy from "./misc/privacy_policy";

export const createNavTheme = (theme: any) => {
  const base = theme.name === "dark" ? NavDarkTheme : DefaultTheme;
  return {
    ...base,
    dark: theme.name === "dark",
    colors: {
      ...base.colors,
      background: theme.background,
      card: theme.card,
      text: theme.text,
      border: theme.border,
      primary: theme.primary,
      notification: theme.secondary,
    },
  };
};