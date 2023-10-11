const BAND_COLORS = [
  '255,0,0',
  '255,157,0',
  '255,255,0',
  '0,128,0'
];

// export function constructNitrogenChartAnnotations(thresholds, finalValue, ) {

// }

export function constructWaterChartAnnotations(thresholds, finalValue) {
  const finalValueIsIn = thresholds.findIndex((t,i) => {
    if (finalValue < t) {
      return true;
    } else if (i === thresholds.length - 1) {
      return true;
    } else {
      return false;
    }
  });

  const annotations = {
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
  plotBands.forEach((pb, i) => annotations.annotations['box' + i] = {
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
  plotLines.forEach((pl, i) => annotations.annotations['line' + i] = {
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

  return annotations;
}

export function calcPointColors(pnts, thresholds) {
  return pnts.map(p => {
    for (let i = 0; i < thresholds.length; i++) {
      if (p < thresholds[i] || i === thresholds.length - 1) {
        return `rgb(${BAND_COLORS[i]})`;
      }
    }
  });
}

export function calcPointBorders(eventsObj, datesArr) {
  const eventDates = Object.values(eventsObj).map((obj: {date:string}) => obj.date);
  
  const borderColors = [];
  const borderWidths = [];
  for (let i = 0; i < datesArr.length; i++) {
    const irrigated = eventDates.includes(datesArr[i]);
    borderColors.push(irrigated ? 'rgb(71, 150, 255)' : 'rgb(0,0,0)');
    borderWidths.push(irrigated ? 2 : 1);
  }
  return { borderColors, borderWidths};
}