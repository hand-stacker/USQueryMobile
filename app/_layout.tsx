import { ApolloProvider } from "@apollo/client/react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer, NavigationIndependentTree } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { client } from "./api/apollo";
import BillInfo from "./bill/[bill_id]";
import BillFYP from "./bill/bill_fyp";
import BillSearch from "./bill/bill_search";
import './globals.css';
import MemberInfo from "./member/[membershipId]";
import MemberFYP from "./member/mem_fyp";
import VoteInfo from "./vote/[vote_id]";
import VoteSearch from "./vote/vote_search";

const RootStack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();
const Workflow = createNativeStackNavigator();


function TabNavigator() {
  return (
    <Tabs.Navigator>
      <Tabs.Screen name="Bill_FYP" component={BillFYP} />
      <Tabs.Screen name="Member_FYP" component={MemberFYP} />
      <Tabs.Screen name="Vote_FYP" component={VoteSearch} />
    </Tabs.Navigator>
  );
}

function WorkflowStack() {
  return (
    <Workflow.Navigator>
      <Workflow.Screen name="Bill_search" component={BillSearch} />
      <Workflow.Screen name="Bill_info" component={BillInfo} />
      <Workflow.Screen name="Vote_info" component={VoteInfo} />
      <Workflow.Screen name="Member_info" component={MemberInfo} />
    </Workflow.Navigator>
  );
}

export default function RootLayout() {
  return (
    <ApolloProvider client={client}>
      <NavigationIndependentTree>
        <NavigationContainer>
          {/*
          <Tabs.Navigator>
            <Tabs.Screen name = "Bill Stack" component={BillStack} options={{ headerShown: false }} />  
            <Tabs.Screen name = "Member Stack" component={MemberStack} options={{ headerShown: false }} />  
          </Tabs.Navigator>
          */}
          <RootStack.Navigator screenOptions={{ headerShown: false }}>
            <RootStack.Screen name="Tabs" component={TabNavigator} />
            <RootStack.Screen name="Workflow" component={WorkflowStack} />
          </RootStack.Navigator>
        </NavigationContainer>
      </NavigationIndependentTree>
    </ApolloProvider>
  );
}
