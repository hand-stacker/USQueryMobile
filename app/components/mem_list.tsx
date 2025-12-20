import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
interface Props {
    data: any;
    navigator: any;
}

const block = (navigator: any, node :any) => {
    return (
    <>
    <Image
        style={{
            width: 51,
            height: 51,
            resizeMode: 'contain',
        }}
        source={{
            uri: node.member__photo_url,
        }}
    />
    <Pressable onPress={() => navToMember(navigator, node.id)}>
    <Text style={styles.text}>{node.member__full_name} {node.state}-{node.party}[0]</Text>
    </Pressable>
    </>
)
}


function navToMember(navigation: any, id: any) {
  navigation.navigate("Member_info", {membershipId: id});
}

const MemberList = ({data, navigator}:Props)=> {
    return (
        <FlatList
            data={data}
            renderItem={({ item }) => {
            // item may be either the `node` wrapper from GraphQL or the local test item
            const node = item.node ?? item;
            return (
                block(navigator, node)
            );
            }}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            ListFooterComponent={() => <View style={{height:50}} />}
        />
    );
}

export default MemberList;

const styles = StyleSheet.create(
    {
        text:{
        }
    }
)