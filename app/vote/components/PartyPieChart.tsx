import React, { FC } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import RNPieChart from 'react-native-pie-chart'

interface Props {
  data: Record<string, number>
  widthAndHeight?: number
  showLabels?: boolean
}

const COLOR_MAP: Record<string, string> = {
  DEMOCRATIC: 'rgba(19, 90, 204, 1)',
  REPUBLICAN: 'rgb(242, 43, 41)',
  INDEPENDENT: 'rgb(128, 128, 128)',
  LIBERTARIAN: 'rgb(242, 175, 41)',
  GREEN: 'rgb(0, 100, 0)',
  UNKNOWN: '#cccccc',
}

const PartyPieChart: FC<Props> = ({
  data,
  widthAndHeight = 150,
  showLabels = true,
}) => {
  const series = Object.entries(data ?? {}).map(([key, value]) => {
    const color = COLOR_MAP[String(key).toUpperCase()] ?? COLOR_MAP.UNKNOWN
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
          {entries.map((e) => {
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

export default PartyPieChart

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    margin: 10,
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