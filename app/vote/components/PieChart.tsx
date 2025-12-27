import React, { FC } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import RNPieChart from 'react-native-pie-chart'

interface Props {
  data: Record<string, number>
  widthAndHeight?: number
  cover?: number
  title?: string
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
  widthAndHeight = 250,
  cover,
  title,
  showLabels = true,
}) => {
  const series = Object.entries(data ?? {}).map(([key, value]) => {
    const color = COLOR_MAP[key.toUpperCase()] ?? '#cccccc'
    if (showLabels) {
      return { value, color}
    }
    return { value, color }
  })

  const coverValue = typeof cover === 'number' ? cover : 0.55

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title ?? ''}</Text>
      <RNPieChart widthAndHeight={widthAndHeight} series={series} cover={coverValue} />
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
  title: {
    fontSize: 24,
    margin: 10,
  },
})