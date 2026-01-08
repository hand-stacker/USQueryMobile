import SearchButton from "@/app/components/SearchButton";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface Props {
  navigation: any;
  mode: 'FYP' | 'Starred' | 'Search';
  handleOpenModal?: () => void;
}

const BillTopNav = ({ navigation, mode, handleOpenModal }: Props) => {
  return (
    <View style={styles.header}>
      <View style={styles.leftSpacer} />
      <View style={styles.centerGroup}>
        <Pressable onPress={() => navigation?.navigate('Bill_FYP') } style={styles.navItem}>
          <Text style={[styles.pageTitle, mode === 'FYP' && styles.activePageTitle]}>For You</Text>
        </Pressable>
        <Pressable onPress={() => navigation?.navigate('Starred_Bills') } style={styles.navItem}>
          <Text style={[styles.pageTitle, mode === 'Starred' && styles.activePageTitle]}>Starred</Text>
        </Pressable>
      </View>
      <View style={styles.rightGroup}>
        <SearchButton highlighted={mode === 'Search'} onPress={mode === 'Search' ? handleOpenModal : () => navigation?.navigate('Searched_Bills')} />
      </View>
    </View>
  );
}

export default BillTopNav;

const styles = StyleSheet.create({
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  activePageTitle: {
    color: '#0073ffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  leftSpacer: {
    flex: 1,
  },
  centerGroup: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightGroup: {
    flex: 1,
    alignItems: 'flex-end',
  },
  navItem: {
    marginHorizontal: 10,
  },
});