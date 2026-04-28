import EmptyPage from "@/app/components/EmptyPage";
import { ThemeContext } from "@/app/theme/themeContext";
import { useContext } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import MemberInfographic, { VoteType } from "./MemberInfographic";

interface Props {
  data: any;
  navigation: any;
  parentHandlePress?: () => void;
  voteType?: VoteType | null;
}

const MemberList = ({ data, navigation, parentHandlePress, voteType }: Props) => {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);

  function handlePress(node: any) {
    return () => {
      parentHandlePress?.();
      navigation.navigate("Member_info", { membershipId: node.id });
    };
  }

  function renderItem({ item }: any) {
    const node = item.node ?? item;
    return (
      <MemberInfographic
        node={node}
        handlePress={handlePress(node)}
        voteType={voteType}
      />
    );
  }

  return (
    <FlatList
      data={data}
      contentContainerStyle={styles.container}
      keyExtractor={(item: any, idx: number) => {
        const base = String(item?.node?.id ?? item?.id ?? idx);
        return `${base}_${idx}`;
      }}
      renderItem={renderItem}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      ListFooterComponent={() => <View style={{ height: 50 }} />}
      initialNumToRender={8}
      ListEmptyComponent={EmptyPage}
      maxToRenderPerBatch={12}
      windowSize={7}
      removeClippedSubviews={true}
    />
  );
};

export default MemberList;

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingBottom: 0,
    paddingTop: 8,
    backgroundColor: theme.background,
  },
});
