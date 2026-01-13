import React, { useState } from 'react';
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
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  
  const timePeriodConfigs: Record<TimePeriod, TimePeriodConfig> = {
    '1month': { label: '1 month', months: 1 },
    '3months': { label: '3 months', months: 3 },
    '6months': { label: '6 months', months: 6 },
    '1year': { label: '1 year', months: 12 }
  };
  
  // Color palette for bars (avoiding red)
  const barColors = [
    '#15803d', // Green
    '#2563eb', // Blue
    '#7c3aed', // Purple
    '#ea580c', // Orange
    '#0891b2'  // Cyan
  ];
  
  const currentProductData = productData[timePeriod];
  const currentTotalData = totalData[timePeriod];
  
  const chartHeight = 150;
  const chartPadding = 30;
  const labelBottomPadding = 20; // Extra space for two-line labels
  
  // For product view
  const maxProductSales = Math.max(...currentProductData.map(d => d.sales), 1);
  const barWidth = 45;
  const barSpacing = 15;
  const productChartWidth = currentProductData.length * (barWidth + barSpacing) - barSpacing;
  
  // For total view
  const maxTotalSales = Math.max(...currentTotalData.map(d => d.total), 1);
  const chartPaddingLeft = 10;
  const chartPaddingRight = 10;
  const totalBarSpacing = 10;
  const availableWidth = 450 - chartPaddingLeft - chartPaddingRight;
  
  // Target bar width similar to 6 months view (~65px)
  const targetBarWidth = 65;
  const maxBarWidth = targetBarWidth;
  const minBarWidth = 25;
  
  // Calculate bar width, but cap it for 1 month and 3 months to match 6 months visually
  const calculatedBarWidth = (availableWidth - (currentTotalData.length - 1) * totalBarSpacing) / currentTotalData.length;
  const totalBarWidth = Math.max(minBarWidth, Math.min(maxBarWidth, calculatedBarWidth));
  const totalChartWidth = chartPaddingLeft + (totalBarWidth * currentTotalData.length) + (totalBarSpacing * (currentTotalData.length - 1)) + chartPaddingRight;

  const handleBarMouseEnter = (index: number, event: React.MouseEvent<SVGRectElement>) => {
    setHoveredBar(index);
    updateTooltipPosition(event);
  };

  const handleTotalBarMouseEnter = (index: number, event: React.MouseEvent<SVGRectElement>) => {
    setHoveredPoint(index);
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

  const renderProductChart = () => {
    return (
      <svg width={productChartWidth} height={chartHeight} viewBox={`0 0 ${productChartWidth} ${chartHeight}`}>
        {currentProductData.map((item, index) => {
          const barHeight = (item.sales / maxProductSales) * (chartHeight - chartPadding);
          const x = index * (barWidth + barSpacing);
          const y = chartHeight - barHeight - 20;
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
                fill="#6b7280"
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
    return (
      <svg width={totalChartWidth} height={chartHeight} viewBox={`0 0 ${totalChartWidth} ${chartHeight}`} style={{ overflow: 'visible' }}>
        {currentTotalData.map((item, index) => {
          const barHeight = (item.total / maxTotalSales) * (chartHeight - chartPadding - labelBottomPadding);
          const x = chartPaddingLeft + index * (totalBarWidth + totalBarSpacing);
          const y = chartHeight - barHeight - labelBottomPadding;
          const opacity = hoveredPoint === index ? 1 : hoveredPoint !== null ? 0.5 : 1;
          
          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={totalBarWidth}
                height={barHeight}
                fill="#15803d"
                opacity={opacity}
                rx={4}
                onMouseEnter={(e) => handleTotalBarMouseEnter(index, e)}
                onMouseLeave={handleMouseLeave}
                onMouseMove={handleTotalBarMouseMove}
                style={{ cursor: 'pointer', transition: 'opacity 0.2s ease' }}
              />
              {/* Month labels - split month and year for better spacing */}
              {(() => {
                const [month, year] = item.date.split(' ');
                return (
                  <>
                    <text
                      x={x + totalBarWidth / 2}
                      y={chartHeight - 12}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#6b7280"
                      className="bar-label"
                    >
                      {month}
                    </text>
                    <text
                      x={x + totalBarWidth / 2}
                      y={chartHeight - 1}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#9ca3af"
                      className="bar-label"
                    >
                      {year}
                    </text>
                  </>
                );
              })()}
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="sales-chart">
      <div className="sales-chart-header">
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
      </div>
      <div className="chart-container">
        {viewType === 'Product' ? renderProductChart() : renderTotalChart()}
        {hoveredBar !== null && tooltipPosition && viewType === 'Product' && (
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
        {hoveredPoint !== null && tooltipPosition && viewType === 'Total' && (
          <div
            className="sales-tooltip"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
            }}
          >
            {currentTotalData[hoveredPoint].total} units
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesChart;

