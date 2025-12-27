import { ApolloProvider } from "@apollo/client/react";
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer, NavigationIndependentTree } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { client } from "./api/apollo";
import BillInfo from "./bill/screens/[bill_id]";
import BillFYP from "./bill/screens/bill_fyp";
import './globals.css';
import MemberInfo from "./member/screens/[membershipId]";
import MemberFYP from "./member/screens/mem_fyp";
import SelectTopicsScreen from "./misc/select_favorites";
import VoteInfo from "./vote/screens/[vote_id]";
import VoteFYP from "./vote/screens/vote_fyp";

const Tabs = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function SharedStack({ route } : {route:any}) {
  const initialRoute = route.params?.initialRoute;

  return (
    <Stack.Navigator initialRouteName={initialRoute}>
      <Stack.Screen name="Bill_FYP" component={BillFYP} options={{ headerShown: false }}/>
      <Stack.Screen name="Bill_info" component={BillInfo} options={{ headerShown: false }}/>
      <Stack.Screen name="Member_FYP" component={MemberFYP} options={{ headerShown: false }}/>
      <Stack.Screen name="Member_info" component={MemberInfo} options={{ headerShown: false }}/>
      <Stack.Screen name="Vote_FYP" component={VoteFYP} options={{ headerShown: false }}/>
      <Stack.Screen name="Vote_info" component={VoteInfo} options={{ headerShown: false }}/>
      <Stack.Screen name="Options_screen" component={SelectTopicsScreen} options={{ headerShown: false }}/>
    </Stack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tabs.Navigator 
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#8ACE00',
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
        initialParams={{ initialRoute: "Member_FYP" }}
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
  return (
    <ApolloProvider client={client}>
      <NavigationIndependentTree>
        <NavigationContainer>
          <TabNavigator />
        </NavigationContainer>
      </NavigationIndependentTree>
    </ApolloProvider>
  );
}
