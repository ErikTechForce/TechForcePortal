import React, { useState, useEffect, useRef } from 'react';
import './SalesChart.css';

type ViewType = 'Total' | 'Product';
type TimePeriod = '1month' | '3months' | '6months' | '1year';

interface TimePeriodConfig {
  label: string;
  months: number;
}

interface ProductSalesData {
  product: string;
  sales: number;
}

interface TotalSalesData {
  date: string;
  total: number;
}

interface SalesChartProps {
  productData: {
    [key in TimePeriod]: ProductSalesData[];
  };
  totalData: {
    [key in TimePeriod]: TotalSalesData[];
  };
}

const SalesChart: React.FC<SalesChartProps> = ({ productData, totalData }) => {
  const [viewType, setViewType] = useState<ViewType>('Product');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('1month');
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{ monthIndex: number; productIndex: number } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(380);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w > 0) setContainerWidth(w);
    });
    ro.observe(el);
    if (el.clientWidth > 0) setContainerWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  
  const timePeriodConfigs: Record<TimePeriod, TimePeriodConfig> = {
    '1month': { label: '1 month', months: 1 },
    '3months': { label: '3 months', months: 3 },
    '6months': { label: '6 months', months: 6 },
    '1year': { label: '1 year', months: 12 }
  };
  
  // Color palette for bars (avoiding red)
  const barColors = [
    '#73BF43', // Green
    '#E48B52', // Orange
    '#5FA8D3', // Blue
    '#B774C6', // Purple
    "#E981A6", // Pink
    '#46B3A2'  // Teal
  ];
  
  const currentProductData = productData[timePeriod];
  const currentTotalData = totalData[timePeriod];
  
  const chartHeight = 200;
  const chartPadding = 30;
  const labelBottomPadding = 20;

  const yAxisWidth = 38;
  const chartPaddingRight = 10;
  const totalBarSpacing = 10;
  const availableWidth = Math.max(80, containerWidth - yAxisWidth - chartPaddingRight);

  // For product view — bar width scales with available space
  const maxProductSales = Math.max(...currentProductData.map(d => d.sales), 1);
  const numProductBars = currentProductData.length;
  const minProductSpacing = 8;
  const maxProductSpacing = 22; // cap so sparse bar counts don't drift apart
  const barWidth = Math.max(18, Math.min(55, (availableWidth - minProductSpacing * Math.max(0, numProductBars - 1)) / numProductBars));
  const barSpacing = numProductBars > 1
    ? Math.min(maxProductSpacing, Math.max(minProductSpacing, (availableWidth - barWidth * numProductBars) / (numProductBars - 1)))
    : 0;
  const productChartWidth = numProductBars * barWidth + Math.max(0, numProductBars - 1) * barSpacing;

  // For total view
  const maxTotalSales = Math.max(...currentTotalData.map(d => d.total), 1);
  const targetBarWidth = 65;
  const maxBarWidth = targetBarWidth;
  const minBarWidth = 25;
  const calculatedBarWidth = (availableWidth - (currentTotalData.length - 1) * totalBarSpacing) / currentTotalData.length;
  const totalBarWidth = Math.max(minBarWidth, Math.min(maxBarWidth, calculatedBarWidth));
  const totalChartWidth = yAxisWidth + (totalBarWidth * currentTotalData.length) + (totalBarSpacing * (currentTotalData.length - 1)) + chartPaddingRight;

  const handleBarMouseEnter = (index: number, event: React.MouseEvent<SVGRectElement>) => {
    setHoveredBar(index);
    updateTooltipPosition(event);
  };

  const handleTotalBarMouseEnter = (
    monthIndex: number,
    productIndex: number,
    event: React.MouseEvent<SVGRectElement>
  ) => {
    setHoveredPoint({ monthIndex, productIndex });
    updateTooltipPosition(event);
  };

  const handleMouseLeave = () => {
    setHoveredBar(null);
    setHoveredPoint(null);
    setTooltipPosition(null);
  };

  const updateTooltipPosition = (event: React.MouseEvent<SVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  };

  const handleBarMouseMove = (event: React.MouseEvent<SVGRectElement>) => {
    if (hoveredBar !== null) {
      updateTooltipPosition(event);
    }
  };

  const handleTotalBarMouseMove = (event: React.MouseEvent<SVGRectElement>) => {
    if (hoveredPoint !== null) {
      updateTooltipPosition(event);
    }
  };

  // Total product sales for the current period, used to compute per-product proportions
  const totalProductSales = currentProductData.reduce((sum, p) => sum + p.sales, 0);
  const hasNoSalesData = totalProductSales === 0;

  // Generate 4-5 "nice" round tick values for a given max
  const getNiceTicks = (maxValue: number): number[] => {
    if (maxValue <= 0) return [0];
    const roughStep = maxValue / 4;
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep || 1)));
    const norm = roughStep / magnitude;
    let step: number;
    if (norm <= 1) step = 1;
    else if (norm <= 2) step = 2;
    else if (norm <= 5) step = 5;
    else step = 10;
    step *= magnitude;
    const ticks: number[] = [];
    for (let v = 0; v <= maxValue + step * 0.01; v += step) {
      const rounded = Math.round(v);
      // Skip duplicates that can appear due to floating-point rounding
      if (ticks.length === 0 || ticks[ticks.length - 1] !== rounded) {
        ticks.push(rounded);
      }
    }
    return ticks;
  };

  const formatTickLabel = (value: number): string => {
    if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
    return String(value);
  };

  const renderProductChart = () => {
    const chartAreaBottom = chartHeight - 20; // baseline (y=0 data value)
    const chartAreaHeight = chartHeight - chartPadding; // drawable bar height
    const svgWidth = yAxisWidth + productChartWidth;
    const ticks = getNiceTicks(maxProductSales);

    return (
      <svg width={svgWidth} height={chartHeight} viewBox={`0 0 ${svgWidth} ${chartHeight}`}>
        {/* Y-axis gridlines and labels */}
        {ticks.map((tick) => {
          const tickY = chartAreaBottom - (tick / maxProductSales) * chartAreaHeight;
          return (
            <g key={tick}>
              <line
                x1={yAxisWidth}
                y1={tickY}
                x2={svgWidth}
                y2={tickY}
                stroke="#8A8F93"
                strokeWidth={1}
              />
              <text
                x={yAxisWidth - 5}
                y={tickY + 4}
                textAnchor="end"
                fontSize="10"
                fill="#8A8F93"
              >
                {formatTickLabel(tick)}
              </text>
            </g>
          );
        })}
        {/* Bars */}
        {currentProductData.map((item, index) => {
          const barHeight = (item.sales / maxProductSales) * chartAreaHeight;
          const x = yAxisWidth + index * (barWidth + barSpacing);
          const y = chartAreaBottom - barHeight;
          const baseColor = barColors[index % barColors.length];
          const opacity = hoveredBar === index ? 1 : hoveredBar !== null ? 0.5 : 1;
          
          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={baseColor}
                opacity={opacity}
                rx={4}
                onMouseEnter={(e) => handleBarMouseEnter(index, e)}
                onMouseLeave={handleMouseLeave}
                onMouseMove={handleBarMouseMove}
                style={{ cursor: 'pointer', transition: 'opacity 0.2s ease' }}
              />
              <text
                x={x + barWidth / 2}
                y={chartHeight - 5}
                textAnchor="middle"
                fontSize="12"
                fill="#5A708D"
                className="bar-label"
              >
                {item.product}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const renderTotalChart = () => {
    const usableHeight = chartHeight - chartPadding - labelBottomPadding;
    const barBottom = chartHeight - labelBottomPadding;
    const ticks = getNiceTicks(maxTotalSales);

    return (
      <svg width={totalChartWidth} height={chartHeight} viewBox={`0 0 ${totalChartWidth} ${chartHeight}`} style={{ overflow: 'visible' }}>
        {/* Y-axis gridlines and labels */}
        {ticks.map((tick) => {
          const tickY = barBottom - (tick / maxTotalSales) * usableHeight;
          return (
            <g key={tick}>
              <line
                x1={yAxisWidth}
                y1={tickY}
                x2={totalChartWidth - chartPaddingRight}
                y2={tickY}
                stroke="#8A8F93"
                strokeWidth={1}
              />
              <text
                x={yAxisWidth - 5}
                y={tickY + 4}
                textAnchor="end"
                fontSize="10"
                fill="#8A8F93"
              >
                {formatTickLabel(tick)}
              </text>
            </g>
          );
        })}
        {currentTotalData.map((item, monthIndex) => {
          const barX = yAxisWidth + monthIndex * (totalBarWidth + totalBarSpacing);
          const totalBarHeight = (item.total / maxTotalSales) * usableHeight;
          const [month, year] = item.date.split(' ');

          // Build stacked segments from bottom to top
          let stackOffset = 0;

          return (
            <g key={monthIndex}>
              {currentProductData.map((product, productIndex) => {
                const proportion = totalProductSales > 0 ? product.sales / totalProductSales : 1 / currentProductData.length;
                const segmentHeight = totalBarHeight * proportion;
                const segmentY = barBottom - stackOffset - segmentHeight;
                const color = barColors[productIndex % barColors.length];
                const isHovered = hoveredPoint?.monthIndex === monthIndex && hoveredPoint?.productIndex === productIndex;
                const anyHovered = hoveredPoint !== null;
                const opacity = isHovered ? 1 : anyHovered ? 0.45 : 1;
                const isTop = productIndex === currentProductData.length - 1;
                const isBottom = productIndex === 0;

                stackOffset += segmentHeight;

                const sharedProps = {
                  key: productIndex,
                  fill: color,
                  opacity,
                  onMouseEnter: (e: React.MouseEvent<SVGElement>) =>
                    handleTotalBarMouseEnter(monthIndex, productIndex, e as React.MouseEvent<SVGRectElement>),
                  onMouseLeave: handleMouseLeave,
                  onMouseMove: (e: React.MouseEvent<SVGElement>) =>
                    handleTotalBarMouseMove(e as React.MouseEvent<SVGRectElement>),
                  style: { cursor: 'pointer', transition: 'opacity 0.2s ease' } as React.CSSProperties,
                };

                const r = 4;
                const x = barX;
                const y = segmentY;
                const w = totalBarWidth;
                const h = segmentHeight;

                if (isTop && isBottom) {
                  // Only one segment — round all four corners
                  const d = `M ${x} ${y + h - r} Q ${x} ${y + h} ${x + r} ${y + h} L ${x + w - r} ${y + h} Q ${x + w} ${y + h} ${x + w} ${y + h - r} L ${x + w} ${y + r} Q ${x + w} ${y} ${x + w - r} ${y} L ${x + r} ${y} Q ${x} ${y} ${x} ${y + r} Z`;
                  return <path {...sharedProps} d={d} />;
                }

                if (isTop) {
                  // Round top-left and top-right corners only
                  const d = `M ${x} ${y + h} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} L ${x + w - r} ${y} Q ${x + w} ${y} ${x + w} ${y + r} L ${x + w} ${y + h} Z`;
                  return <path {...sharedProps} d={d} />;
                }

                if (isBottom) {
                  // Round bottom-left and bottom-right corners only
                  const d = `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} L ${x + r} ${y + h} Q ${x} ${y + h} ${x} ${y + h - r} Z`;
                  return <path {...sharedProps} d={d} />;
                }

                return (
                  <rect
                    {...sharedProps}
                    x={barX}
                    y={segmentY}
                    width={totalBarWidth}
                    height={segmentHeight}
                  />
                );
              })}
              {/* Month labels */}
              <text
                x={barX + totalBarWidth / 2}
                y={chartHeight - 12}
                textAnchor="middle"
                fontSize="11"
                fill="#5A708D"
                className="bar-label"
              >
                {month}
              </text>
              <text
                x={barX + totalBarWidth / 2}
                y={chartHeight - 1}
                textAnchor="middle"
                fontSize="10"
                fill="#8A8F93"
                className="bar-label"
              >
                {year}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="sales-chart">
      <h3 className="chart-title">Sales</h3>
      <div className="sales-chart-toggles">
        <div className="view-toggle">
          <button
            className={`toggle-btn ${viewType === 'Product' ? 'active' : ''}`}
            onClick={() => setViewType('Product')}
          >
            Product
          </button>
          <button
            className={`toggle-btn ${viewType === 'Total' ? 'active' : ''}`}
            onClick={() => setViewType('Total')}
          >
            Total
          </button>
        </div>
        <div className="period-toggle">
          <button
            className={`period-btn ${timePeriod === '1month' ? 'active' : ''}`}
            onClick={() => setTimePeriod('1month')}
          >
            1 month
          </button>
          <button
            className={`period-btn ${timePeriod === '3months' ? 'active' : ''}`}
            onClick={() => setTimePeriod('3months')}
          >
            3 months
          </button>
          <button
            className={`period-btn ${timePeriod === '6months' ? 'active' : ''}`}
            onClick={() => setTimePeriod('6months')}
          >
            6 months
          </button>
          <button
            className={`period-btn ${timePeriod === '1year' ? 'active' : ''}`}
            onClick={() => setTimePeriod('1year')}
          >
            1 year
          </button>
        </div>
      </div>
      <div className="chart-container" ref={containerRef}>
        {hasNoSalesData ? (
          <div className="sales-chart-empty">
            <span>No completed sales for this period</span>
          </div>
        ) : viewType === 'Product' ? renderProductChart() : renderTotalChart()}
        {!hasNoSalesData && hoveredBar !== null && tooltipPosition && viewType === 'Product' && (
          <div
            className="sales-tooltip"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
            }}
          >
            {currentProductData[hoveredBar].sales} units
          </div>
        )}
        {!hasNoSalesData && hoveredPoint !== null && tooltipPosition && viewType === 'Total' && (() => {
          const { monthIndex, productIndex } = hoveredPoint;
          const item = currentTotalData[monthIndex];
          const product = currentProductData[productIndex];
          const proportion = totalProductSales > 0 ? product.sales / totalProductSales : 1 / currentProductData.length;
          const estimatedValue = Math.round(item.total * proportion);
          return (
            <div
              className="sales-tooltip"
              style={{
                left: `${tooltipPosition.x}px`,
                top: `${tooltipPosition.y}px`,
              }}
            >
              {product.product}: {estimatedValue} units
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default SalesChart;

