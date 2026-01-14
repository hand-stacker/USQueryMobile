import { ApolloProvider } from "@apollo/client/react";
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  NavigationContainer,
  NavigationIndependentTree
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";

import { client } from "./api/apollo";
import { navigate, navigationRef } from "./navigation/navigationRef";

import BillInfo from "./bill/screens/[bill_id]";
import BillFYP from "./bill/screens/bill_fyp";
import StarredBills from "./bill/screens/starred_bills";
import MemberInfo from "./member/screens/[membershipId]";
import WelcomeFavoritesModal from './misc/WelcomeFavoritesModal';
import VoteInfo from "./vote/screens/[vote_id]";
import VoteFYP from "./vote/screens/vote_fyp";

import Login from "./auth/login";
import RegisterAccount from "./auth/register";
import VerifyEmail from "./auth/verify";
import BillSearchResults from "./bill/screens/searched_bills";
import './globals.css';
import SearchedMembers from "./member/screens/searched_members";
import StarredMembers from "./member/screens/starred_members";
import OptionsPage from "./misc/options";
import VoteSearchResults from "./vote/screens/searched_votes";

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
      
    </Stack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tabs.Navigator 
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#0073ffff',
        tabBarInactiveTintColor: '#6b7280',
        tabBarIcon: ({ color, size }) => {
          const name =
            route.name === 'Bills' ? 'newspaper-outline' :
            route.name === 'Members' ? 'people-outline' :
            route.name === 'Votes' ? 'checkmark-done-outline' :
            route.name === 'Options' ? 'options-outline' :
            'ellipse-outline';
          return <Ionicons name={name as any} size={size} color={color} />;
        },
      })}
      >
      <Tabs.Screen
        name="Bills"
        component={SharedStack}
        initialParams={{ initialRoute: "Bill_FYP" }}
        options={{ headerShown: false }}
      />
      <Tabs.Screen
        name="Members"
        component={SharedStack}
        initialParams={{ initialRoute: "Starred_Members" }}
        options={{ headerShown: false }}
      />
      <Tabs.Screen
        name="Votes"
        component={SharedStack}
        initialParams={{ initialRoute: "Vote_FYP" }}
        options={{ headerShown: false }}
      />
      <Tabs.Screen
        name="Options"
        component={SharedStack}
        initialParams={{ initialRoute: "Options_screen" }}
        options={{ headerShown: false }}
      />
    </Tabs.Navigator>
  );
}

export default function RootLayout() {
  useEffect(() => {
    const sub =
      Notifications.addNotificationResponseReceivedListener(response => {
        const billId =
          response.notification.request.content.data?.bill_id;

        if (billId) {
          navigate("Bill_info", { bill_id: billId });
        }
      });

    return () => sub.remove();
  }, []);

  return (
    <ApolloProvider client={client}>
      <NavigationIndependentTree>
        <NavigationContainer ref={navigationRef}>
          <TabNavigator />
          <WelcomeFavoritesModal />
        </NavigationContainer>
      </NavigationIndependentTree>
    </ApolloProvider>
  );
}

