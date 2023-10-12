const PLANTED_INDICATOR_OPTIONS = {
  content: 'Planted', 
  color: '#51db32'
};
const TERMINATION_INDICATOR_OPTIONS = {
  content: 'Terminated', 
  color: '#bf1111'
};

function createVerticalIndicator(idx, optsObj) {
  return {
    type: 'line',
    drawTime: 'beforeDraw',
    borderWidth: 1,
    borderColor: optsObj.color,
    adjustScaleRange: false,
    xMin: idx,
    xMax: idx,
    label: {
      content: optsObj.content,
      drawTime: 'beforeDraw',
      color: optsObj.color,
      display: true,
      position: 'end',
      xAdjust: 5,
      rotation: 90,
      font: {
        size: '10px'
      },
      backgroundColor: 'transparent'
    }
  }
}

export function constructNitrogenChartDetails(tins, testResults, dates, plantingDateIdx, terminationDateIdx) {
  const THRESHOLDS = [25,30];
  const BAND_COLORS = [
    '255,0,0',
    '255,255,0',
    '0,128,0'
  ];
  const EVENT_HIGHLIGHT_COLOR = '#FF3E00';

  const finalValue = tins[tins.length - 1];
  let finalValueIsIn = THRESHOLDS.findIndex(t => finalValue < t);
  if (finalValueIsIn === -1) finalValueIsIn = THRESHOLDS.length;

  const tinAnnotations = {
    annotations: {}
  };

  const plotBands = [{
    yMax: THRESHOLDS[0],
    yMin: undefined,
    backgroundColor: `rgba(${BAND_COLORS[0]},0.1)`,
    label: 'Apply 30lbs/acre twice, 3-4 weeks apart'
  },{
    yMax: THRESHOLDS[1],
    yMin: THRESHOLDS[0],
    backgroundColor: `rgba(${BAND_COLORS[1]},0.1)`,
    label: 'Apply 15lbs/acre twice, 3-4 weeks apart'
  },{
    yMax: undefined,
    yMin: THRESHOLDS[1],
    backgroundColor: `rgba(${BAND_COLORS[2]},0.1)`,
    label: 'No sidedress necessary'
  }];
  plotBands.forEach((pb, i) => tinAnnotations.annotations['box' + i] = {
    type: 'box',
    drawTime: 'beforeDraw',
    borderWidth: 0,
    adjustScaleRange: false,
    yMax: pb.yMax,
    yMin: pb.yMin,
    backgroundColor: i === finalValueIsIn ? pb.backgroundColor : 'transparent',
    label: {
      content: pb.label,
      drawTime: 'beforeDraw',
      color: i === finalValueIsIn  ? 'rgb(50,50,50)' : 'rgb(120,120,120)',
      display: true,
      position: { x: 'start', y: 'center'},
      font: {
        size: '16px',
        weight: i === finalValueIsIn  ? 'bold' : 'normal'
      },
      backgroundColor: 'transparent'
    }
  });

  const plotLines = [{
    yMin: THRESHOLDS[1],
    yMax: THRESHOLDS[1],
    label: 'Apply half sidedress'
  },{
    yMin: THRESHOLDS[0],
    yMax: THRESHOLDS[0],
    label: 'Apply full sidedress'
  }];
  plotLines.forEach((pl, i) => tinAnnotations.annotations['line' + i] = {
    type: 'line',
    drawTime: 'beforeDraw',
    borderWidth: 1,
    borderColor: 'rgb(150,150,150)',
    adjustScaleRange: false,
    ...pl,
    label: {
      content: pl.label,
      drawTime: 'beforeDraw',
      color: 'rgb(120,120,120)',
      display: true,
      position: 'end',
      yAdjust: 10,
      xAdjust: 10,
      font: {
        size: '10px'
      },
      backgroundColor: 'transparent'
    },
  });

  tinAnnotations.annotations['plantingDate'] = createVerticalIndicator(plantingDateIdx, PLANTED_INDICATOR_OPTIONS);
  tinAnnotations.annotations['terminationDate'] = createVerticalIndicator(terminationDateIdx, TERMINATION_INDICATOR_OPTIONS);

  return {
    tinAnnotations,
    tinPntColors: calcPointColors(tins, THRESHOLDS, BAND_COLORS),
    tinPntBorders: calcPointBorders(testResults, dates, EVENT_HIGHLIGHT_COLOR)
  };
}

export function constructWaterChartDetails(thresholds, vwcs, applications, dates, plantingDateIdx, terminationDateIdx) {
  const BAND_COLORS = [
    '255,0,0',
    '255,157,0',
    '255,255,0',
    '0,128,0'
  ];
  const EVENT_HIGHLIGHT_COLOR = 'rgb(71, 150, 255)';
  
  const finalValue = vwcs[vwcs.length - 1];
  let finalValueIsIn = thresholds.findIndex(t => finalValue < t);
  if (finalValueIsIn === -1) finalValueIsIn = thresholds.length - 1;

  const vwcAnnotations = {
    annotations: {}
  };

  const plotBands = [{
    yMax: thresholds[0],
    yMin: undefined,
    backgroundColor: `rgba(${BAND_COLORS[0]},0.1)`,
    label: 'Deficit, severe plant stress'
  },{
    yMax: thresholds[1],
    yMin: thresholds[0],
    backgroundColor: `rgba(${BAND_COLORS[1]},0.1)`,
    label: 'Deficit, plant stress likely'
  },{
    yMax: thresholds[2],
    yMin: thresholds[1],
    backgroundColor: `rgba(${BAND_COLORS[2]},0.1)`,
    label: 'Deficit, no plant stress'
  },{
    yMax: undefined,
    yMin: thresholds[2],
    backgroundColor: `rgba(${BAND_COLORS[3]},0.1)`,
    label: 'No deficit for plant'
  }];
  plotBands.forEach((pb, i) => vwcAnnotations.annotations['box' + i] = {
    type: 'box',
    drawTime: 'beforeDraw',
    borderWidth: 0,
    adjustScaleRange: false,
    yMax: pb.yMax,
    yMin: pb.yMin,
    backgroundColor: i === finalValueIsIn ? pb.backgroundColor : 'transparent',
    label: {
      content: pb.label,
      drawTime: 'beforeDraw',
      color: i === finalValueIsIn  ? 'rgb(50,50,50)' : 'rgb(120,120,120)',
      display: true,
      position: { x: 'start', y: 'center'},
      font: {
        size: '16px',
        weight: i === finalValueIsIn  ? 'bold' : 'normal'
      },
      backgroundColor: 'transparent'
    }
  });

  const plotLines = [{
    yMin: thresholds[3],
    yMax: thresholds[3],
    label: 'Saturated'
  },{
    yMin: thresholds[2],
    yMax: thresholds[2],
    label: 'Field Capacity'
  },{
    yMin: thresholds[1],
    yMax: thresholds[1],
    label: 'Plant Stress Begin'
  },{
    yMin: thresholds[0],
    yMax: thresholds[0],
    label: 'Wilting Danger Exists'
  }];
  plotLines.forEach((pl, i) => vwcAnnotations.annotations['line' + i] = {
    type: 'line',
    drawTime: 'beforeDraw',
    borderWidth: 1,
    borderColor: 'rgb(150,150,150)',
    adjustScaleRange: false,
    ...pl,
    label: {
      content: pl.label,
      drawTime: 'beforeDraw',
      color: 'rgb(120,120,120)',
      display: true,
      position: 'end',
      yAdjust: 10,
      xAdjust: 10,
      font: {
        size: '10px'
      },
      backgroundColor: 'transparent'
    },
  });

  // irrigationIdxs.forEach(idx => annotations.annotations['irri' + idx] = {
  //   type: 'line',
  //   drawTime: 'beforeDraw',
  //   borderWidth: 1,
  //   borderColor: 'rgb(150,150,250)',
  //   adjustScaleRange: false,
  //   xMin: idx,
  //   xMax: idx,
  //   label: {
  //     content: 'Irrigation',
  //     drawTime: 'beforeDraw',
  //     color: 'rgb(120,120,220)',
  //     display: true,
  //     position: 'start',
  //     yAdjust: 10,
  //     xAdjust: 3,
  //     rotation: 90,
  //     font: {
  //       size: '10px'
  //     },
  //     backgroundColor: 'transparent'
  //   }
  // });

  vwcAnnotations.annotations['plantingDate'] = createVerticalIndicator(plantingDateIdx, PLANTED_INDICATOR_OPTIONS);
  vwcAnnotations.annotations['terminationDate'] = createVerticalIndicator(terminationDateIdx, TERMINATION_INDICATOR_OPTIONS);

  return {
    vwcAnnotations,
    vwcPntColors: calcPointColors(vwcs, thresholds, BAND_COLORS),
    vwcPntBorders: calcPointBorders(applications, dates, EVENT_HIGHLIGHT_COLOR)
  };
}

export function calcPointColors(pnts, thresholds, colors) {
  return pnts.map(p => {
    for (let i = 0; i < thresholds.length; i++) {
      if (p < thresholds[i]) {
        return `rgb(${colors[i]})`;
      } else if (i === thresholds.length - 1) {
        return `rgb(${colors[colors.length - 1]})`;
      }
    }
  });
}

export function calcPointBorders(eventsObj, datesArr, borderColor) {
  const eventDates = Object.values(eventsObj).map((obj: {date:string}) => obj.date);
  
  const borderColors = [];
  const borderWidths = [];
  for (let i = 0; i < datesArr.length; i++) {
    const occurred = eventDates.includes(datesArr[i]);
    borderColors.push(occurred ? borderColor : 'rgb(0,0,0)');
    borderWidths.push(occurred ? 2 : 1);
  }
  return { borderColors, borderWidths};
}