import React, { FC } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import RNPieChart from 'react-native-pie-chart'

interface Props {
  data: Record<string, number>
  widthAndHeight?: number
  showLabels?: boolean
}

const COLOR_MAP: Record<string, string> = {
  YEAS: 'rgba(7, 175, 33, 1)',
  NAYS: 'rgb(242, 43, 41)',
  PRES: 'rgb(242, 175, 41)',
  NOVT: 'rgb(38, 35, 34)',
}

const VotePieChart: FC<Props> = ({
  data,
  widthAndHeight = 200,
  showLabels = true,
}) => {
  const series = Object.entries(data ?? {}).map(([key, value]) => {
    const color = COLOR_MAP[key.toUpperCase()] ?? '#cccccc'
    return { value, color }
  })

  const total = Object.values(data ?? {}).reduce((sum, v) => sum + (v || 0), 0)

  const entries = Object.entries(data ?? {}).map(([key, value]) => {
    const v = value ?? 0
    const color = COLOR_MAP[key.toUpperCase()] ?? '#cccccc'
    const percent = total > 0 ? (v / total) * 100 : 0
    return { key, value: v, color, percent }
  })


  return (
    <View style={styles.container}>
      <RNPieChart widthAndHeight={widthAndHeight} series={series} />
      {showLabels && (
        <View style={styles.labels}>
          {entries.filter(e => (e.value ?? 0) > 0).map((e) => {
            const pct = e.percent >= 1 ? Math.round(e.percent) : Number(e.percent.toFixed(1))
            return (
              <View key={e.key} style={styles.labelRow}>
                <View style={[styles.swatch, { backgroundColor: e.color }]} />
                <Text style={styles.labelText}>{e.key}: {pct}% ({e.value})</Text>
              </View>
            )
          })}
        </View>
      )}
    </View>
  )
}

export default VotePieChart

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  labels: {
    width: '100%',
    paddingHorizontal: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  swatch: {
    width: 14,
    height: 14,
    borderRadius: 3,
    marginRight: 8,
  },
  labelText: {
    fontSize: 14,
    color: '#0f172a',
  }
})