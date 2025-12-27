import { FlatList, StyleSheet, View } from "react-native";
import MemberInfographic from "./MemberInfographic";
interface Props {
    data: any;
    navigation: any;
    parentHandlePress?: () => void;
}

const MemberList = ({data, navigation, parentHandlePress}:Props)=> {
    function handlePress(node: any, navigation: any) {
        return () => {
            parentHandlePress?.();
            navToMember(navigation, node);
        };
    }

    function navToMember(navigation: any, node: any) {
        navigation.navigate("Member_info", { membershipId: node.id });
    }

    function renderItem({ item }: any) {
        const node = item.node ?? item;
        return <MemberInfographic node={node} handlePress={handlePress(node, navigation)} />;
    };

    return (
        <FlatList
            data={data}
            contentContainerStyle={styles.container}
            keyExtractor={(item: any, idx: number) => {
                // Ensure uniqueness by appending the index — prevents duplicate-key crashes
                const base = String(item?.node?.id ?? item?.id ?? idx);
                return `${base}_${idx}`;
            }}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            ListFooterComponent={() => <View style={{height:50}} />}
            initialNumToRender={8}
            maxToRenderPerBatch={12}
            windowSize={7}
            removeClippedSubviews={true}
        />
    );
}

export default MemberList;

const styles = StyleSheet.create(
    {
        container: {
            paddingHorizontal: 12,
            paddingBottom: 0,
            paddingTop: 8,
            backgroundColor: '#f8fafc',
        }
    }
)