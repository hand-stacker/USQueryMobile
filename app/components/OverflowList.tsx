import CloseButton from '@/app/components/CloseButton';
import { ThemeContext } from '@/app/theme/themeContext';
import React, { useContext, useMemo, useState } from 'react';
import { FlatList, ListRenderItem, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

export interface OverflowListProps {
  data: any[];
  renderItem: ListRenderItem<any>;
  keyExtractor: (item: any, index: number) => string;
  title: string;
}

const MOCK_SEPARATORS = { highlight: () => {}, unhighlight: () => {}, updateProps: () => {} };
const MAX_PREVIEW_ITEMS = 6;
const CHUNK_SIZE = 6;

export default function OverflowList({ data, renderItem, keyExtractor, title }: OverflowListProps) {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  const [modalVisible, setModalVisible] = useState(false);

  const hasMore = data.length >= MAX_PREVIEW_ITEMS;
  const previewData = hasMore ? data.slice(0, MAX_PREVIEW_ITEMS) : data;
  const chunks = useMemo(() => {
    const result: any[][] = [];
    for (let i = 0; i < data.length; i += CHUNK_SIZE) result.push(data.slice(i, i + CHUNK_SIZE));
    return result;
  }, [data]);

  return (
    <>
      <View style={[{ maxHeight: 120 }, styles.listWrap]}>
        {previewData.map((item, index) => (
          <React.Fragment key={keyExtractor(item, index)}>
            {renderItem({ item, index, separators: MOCK_SEPARATORS })}
          </React.Fragment>
        ))}
      </View>

      <Pressable style={styles.viewAllBtn} onPress={() => setModalVisible(true)}>
        <Text style={styles.viewAllText}>View full list</Text>
      </Pressable>

      <Modal visible={modalVisible} animationType="fade" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <CloseButton onPress={() => setModalVisible(false)} />
            </View>
            <FlatList
              data={chunks}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item: chunk, index: chunkIndex }) => (
                <View style={styles.listWrap}>
                  {chunk.map((item: any, localIndex: number) => {
                    const globalIndex = chunkIndex * CHUNK_SIZE + localIndex;
                    return (
                      <React.Fragment key={keyExtractor(item, globalIndex)}>
                        {renderItem({ item, index: globalIndex, separators: MOCK_SEPARATORS })}
                      </React.Fragment>
                    );
                  })}
                </View>
              )}
              contentContainerStyle={{ paddingTop: 4 }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  listWrap: {
    overflow: 'hidden',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  viewAllBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.primary,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.overlay,
  },
  modalCard: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: theme.background,
    padding: 18,
    borderRadius: 12,
    elevation: 6,
    shadowColor: theme.shadow,
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalTitle: {
    maxWidth: '80%',
    color: theme.titleText,
    fontSize: 18,
    fontWeight: '700',
  },
});
