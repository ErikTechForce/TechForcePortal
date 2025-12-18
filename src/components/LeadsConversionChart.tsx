import React, { useState } from 'react';
import './LeadsConversionChart.css';

type TimePeriod = 30 | 90 | 180 | 365;

interface LeadsData {
  totalLeads: number;
  convertedLeads: number;
}

interface LeadsConversionChartProps {
  data: {
    [key in TimePeriod]: LeadsData;
  };
}

const LeadsConversionChart: React.FC<LeadsConversionChartProps> = ({ data }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(30);
  
  const currentData = data[selectedPeriod];
  const conversionPercentage = currentData.totalLeads > 0 ? (currentData.convertedLeads / currentData.totalLeads) * 100 : 0;
  const conversionPercentageRounded = Math.round(conversionPercentage * 10) / 10; // Round to 1 decimal place
  const gaugeAngle = (conversionPercentage / 100) * 180; // Half circle gauge (0-180 degrees)
  
  // Determine color based on conversion percentage
  let gaugeColor = '#15803d'; // Green (default)
  let percentageColor = '#15803d';
  
  if (conversionPercentage < 2) {
    gaugeColor = '#dc2626'; // Red
    percentageColor = '#dc2626';
  } else if (conversionPercentage >= 2 && conversionPercentage <= 5) {
    gaugeColor = '#eab308'; // Yellow
    percentageColor = '#eab308';
  } else {
    gaugeColor = '#15803d'; // Green
    percentageColor = '#15803d';
  }
  
  const size = 200;
  const radius = size / 2 - 20;
  const centerX = size / 2;
  const centerY = size / 2 + 10; // Slightly lower for half circle
  
  // Calculate the gauge arc
  const startAngle = -180;
  const endAngle = -180 + gaugeAngle;
  
  const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
  const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
  const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
  const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
  
  const largeArcFlag = gaugeAngle > 180 ? 1 : 0;
  
  const gaugePath = [
    `M ${centerX - radius} ${centerY}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
  ].join(' ');
  
  // Background arc (full half circle)
  const bgPath = [
    `M ${centerX - radius} ${centerY}`,
    `A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`,
  ].join(' ');

  return (
    <div className="leads-conversion-chart">
      <h3 className="chart-title">Leads Conversion</h3>
      <div className="gauge-container">
        <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
          {/* Background arc */}
          <path
            d={bgPath}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="20"
            strokeLinecap="round"
          />
          {/* Gauge arc */}
          <path
            d={gaugePath}
            fill="none"
            stroke={gaugeColor}
            strokeWidth="20"
            strokeLinecap="round"
          />
        </svg>
        <div className="gauge-value">
          <span className="gauge-percentage" style={{ color: percentageColor }}>{conversionPercentageRounded}%</span>
        </div>
      </div>
      <div className="leads-stats">
        <div className="leads-stat-item">
          <span className="leads-stat-label">Total Leads ({selectedPeriod} days):</span>
          <span className="leads-stat-value">{currentData.totalLeads}</span>
        </div>
        <div className="leads-stat-item">
          <span className="leads-stat-label">Converted:</span>
          <span className="leads-stat-value">{currentData.convertedLeads}</span>
        </div>
      </div>
      <div className="time-period-toggle">
        <button
          className={`toggle-button ${selectedPeriod === 30 ? 'active' : ''}`}
          onClick={() => setSelectedPeriod(30)}
        >
          30
        </button>
        <button
          className={`toggle-button ${selectedPeriod === 90 ? 'active' : ''}`}
          onClick={() => setSelectedPeriod(90)}
        >
          90
        </button>
        <button
          className={`toggle-button ${selectedPeriod === 180 ? 'active' : ''}`}
          onClick={() => setSelectedPeriod(180)}
        >
          180
        </button>
        <button
          className={`toggle-button ${selectedPeriod === 365 ? 'active' : ''}`}
          onClick={() => setSelectedPeriod(365)}
        >
          365
        </button>
      </div>
    </div>
  );
};

export default LeadsConversionChart;

