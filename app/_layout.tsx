import { ApolloProvider } from "@apollo/client/react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer, NavigationIndependentTree } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { client } from "./api/apollo";
import BillInfo from "./bill/[bill_id]";
import BillFYP from "./bill/bill_fyp";
import './globals.css';
import MemberInfo from "./member/[membershipId]";
import MemberFYP from "./member/mem_fyp";
import SelectTopicsScreen from "./misc/select_favorites";
import VoteInfo from "./vote/[vote_id]";
import VoteFYP from "./vote/vote_fyp";

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
      <Stack.Screen name="Select_Favorite_Topics" component={SelectTopicsScreen} options={{ headerShown: false }}/>
    </Stack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tabs.Navigator>
      <Tabs.Screen
        name="Bill_TAB"
        component={SharedStack}
        initialParams={{ initialRoute: "Bill_FYP" }}
        options={{ headerShown: false }}
      />
      <Tabs.Screen
        name="Member_TAB"
        component={SharedStack}
        initialParams={{ initialRoute: "Member_FYP" }}
        options={{ headerShown: false }}
      />
      <Tabs.Screen
        name="Vote_TAB"
        component={SharedStack}
        initialParams={{ initialRoute: "Vote_FYP" }}
        options={{ headerShown: false }}
      />
      <Tabs.Screen
        name="SELECT_TAB"
        component={SharedStack}
        initialParams={{ initialRoute: "Select_Favorite_Topics" }}
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
