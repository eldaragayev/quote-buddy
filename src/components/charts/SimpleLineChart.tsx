import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Svg, Line, Circle, Path, G, Text as SvgText } from 'react-native-svg';
import { Colors, Typography, Spacing } from '../../styles/theme';

const { width: screenWidth } = Dimensions.get('window');
const CHART_WIDTH = screenWidth - Spacing.lg * 4;
const CHART_HEIGHT = 180;
const PADDING = { top: 20, right: 10, bottom: 30, left: 50 };

interface DataPoint {
  x: number;
  y: number;
  label: string;
  value: number;
}

interface SimpleLineChartProps {
  data: DataPoint[];
  color?: string;
  showGrid?: boolean;
  formatValue?: (value: number) => string;
}

export const SimpleLineChart: React.FC<SimpleLineChartProps> = ({
  data,
  color = Colors.primary,
  showGrid = true,
  formatValue = (v) => v.toFixed(0),
}) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  const chartWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const chartHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  // Calculate scales
  const maxY = Math.max(...data.map(d => d.value));
  const minY = 0;
  const yRange = maxY - minY || 1;

  // Scale functions
  const scaleX = (index: number) => (index / (data.length - 1)) * chartWidth;
  const scaleY = (value: number) => chartHeight - ((value - minY) / yRange) * chartHeight;

  // Create path for line
  const linePath = data
    .map((point, index) => {
      const x = scaleX(index);
      const y = scaleY(point.value);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Create grid lines
  const gridLines = [];
  const yAxisLabels = [];
  const gridCount = 4;
  
  for (let i = 0; i <= gridCount; i++) {
    const y = (i / gridCount) * chartHeight;
    const value = minY + (1 - i / gridCount) * yRange;
    
    if (showGrid) {
      gridLines.push(
        <Line
          key={`grid-${i}`}
          x1={0}
          y1={y}
          x2={chartWidth}
          y2={y}
          stroke={Colors.border}
          strokeWidth={1}
          strokeDasharray="3,3"
        />
      );
    }
    
    yAxisLabels.push(
      <SvgText
        key={`label-${i}`}
        x={-10}
        y={y + 4}
        fontSize={10}
        fill={Colors.textSecondary}
        textAnchor="end"
      >
        {formatValue(value)}
      </SvgText>
    );
  }

  return (
    <View style={styles.container}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        <G transform={`translate(${PADDING.left}, ${PADDING.top})`}>
          {/* Grid lines */}
          {gridLines}
          
          {/* Y-axis labels */}
          {yAxisLabels}
          
          {/* Line chart */}
          <Path
            d={linePath}
            stroke={color}
            strokeWidth={2}
            fill="none"
          />
          
          {/* Data points */}
          {data.map((point, index) => (
            <Circle
              key={`point-${index}`}
              cx={scaleX(index)}
              cy={scaleY(point.value)}
              r={4}
              fill={color}
            />
          ))}
          
          {/* X-axis labels */}
          {data.map((point, index) => (
            <SvgText
              key={`x-label-${index}`}
              x={scaleX(index)}
              y={chartHeight + 20}
              fontSize={10}
              fill={Colors.textSecondary}
              textAnchor="middle"
            >
              {point.label}
            </SvgText>
          ))}
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  emptyContainer: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
});