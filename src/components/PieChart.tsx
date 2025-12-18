import React, { useState } from 'react';
import './PieChart.css';

interface PieChartData {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  size?: number;
}

const PieChart: React.FC<PieChartProps> = ({ data, size = 200 }) => {
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) {
    return (
      <div className="pie-chart-container" style={{ width: size, height: size }}>
        <div className="pie-chart-empty">No data</div>
      </div>
    );
  }

  let currentAngle = -90; // Start at top
  const radius = size / 2 - 10;
  const centerX = size / 2;
  const centerY = size / 2;

  const handleMouseEnter = (index: number, event: React.MouseEvent<SVGPathElement>) => {
    setHoveredSlice(index);
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    });
  };

  const handleMouseLeave = () => {
    setHoveredSlice(null);
    setTooltipPosition(null);
  };

  const handleMouseMove = (event: React.MouseEvent<SVGPathElement>) => {
    if (hoveredSlice !== null) {
      const rect = event.currentTarget.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      });
    }
  };

  const paths = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
    const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
    const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
    const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
    
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');

    currentAngle += angle;

    return (
      <path
        key={index}
        d={pathData}
        fill={item.color}
        stroke="white"
        strokeWidth="2"
        onMouseEnter={(e) => handleMouseEnter(index, e)}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        style={{ cursor: 'pointer', opacity: hoveredSlice === index ? 0.8 : 1, transition: 'opacity 0.2s ease' }}
      />
    );
  });

  return (
    <div className="pie-chart-container" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {paths}
      </svg>
      {hoveredSlice !== null && tooltipPosition && (
        <div
          className="pie-chart-tooltip"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
          }}
        >
          <div className="tooltip-label">{data[hoveredSlice].label}</div>
          <div className="tooltip-value">{data[hoveredSlice].value} robots</div>
        </div>
      )}
    </div>
  );
};

export default PieChart;





