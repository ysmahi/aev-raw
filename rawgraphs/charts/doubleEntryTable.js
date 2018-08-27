(function () {
  /* Creation of model */
  let model = raw.model()

  let dimColumnRaw = model.dimension()
    .title('Name Columns')
    .types(String)

  let dimRowRaw = model.dimension()
    .title('Name Rows')
    .types(String)

  let dimElementInsideRaw = model.dimension()
    .title('Elements inside cells')
    .types(String)

  let colorElements = model.dimension()
    .title('Color of Elements')
    .types(String, Number)

  /* Map function */
  model.map(data => {
    return data.map(el => {
      console.log('colorEle', (colorElements()))
      console.log(colorElements()?el[colorElements()]:0.5)
      return {
        dimColumn: el[dimColumnRaw()],
        dimRow: el[dimRowRaw()],
        dimElementInside: el[dimElementInsideRaw()],
        colorElement: colorElements()?el[colorElements()]:0.5
      }
    })
  })

  /* Definition of chart options */
  let chart = raw.chart()
  chart.model(model)
  chart.title('Double Entry Table')
    .description('Double table entry table to display elements that are in one cell or on multiple cells at once')

  let rawWidth = chart.number()
    .title('Width')
    .defaultValue(800)

  let rawHeight = chart.number()
    .title('Height')
    .defaultValue(1100)

  let margin = chart.number()
    .title('Margin')
    .defaultValue(10)

  let colors  = chart.color()
    .title('Color scale')

  let chartOptions = {
    spot_radius : 30,
    svg_inside_width: 60,
    svg_inside_height: 60,
    spot_cell_padding : 45,
    spot_cell_margin : 0,
    min_color : '#efefef',
    max_color : '#01579b',
    stroke_color : '#01579b',
    spot_matrix_type : 'ring'
  }

  /* Drawing function */
  chart.draw(function(selection, data) {
    // data is the data structure resulting from the application of the model
    console.log('dataChart', data)
    let dimColumn = 'dimColumn'
    let dimRow = 'dimRow'
    let dimElementInside = 'dimElementInside'
    let color1 = {red: 0, green: 153, blue: 51}
    let color2 = {red: 204, green: 0, blue: 204}

    let margin = {top: 30, right: 0, bottom: 20, left: 0},
      width =  +rawWidth() - 25,
      height = +rawHeight() - margin.top - margin.bottom;

    selection
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.bottom + margin.top)
      .style("margin-left", -margin.left + "px")
      .style("margin.right", -margin.right + "px")

    let divGridGraph = selection.append('g')
      .attr('class', 'gridGraph')

    /* Retrieve data from dataset */
    // Create columns' and rows' name arrays
    let columnsName = data.map(el => el[dimColumn]).filter((v, i, a) => a.indexOf(v) === i)
    let colNamesPlusEmpty = data.map(el => el[dimColumn]).filter((v, i, a) => a.indexOf(v) === i)
    colNamesPlusEmpty.unshift('')
    let rowsName = data.map(el => el[dimRow]).filter((v, i, a) => a.indexOf(v) === i)

    // Create dataset of elements that are on multiple dimensions
    let ElementInsideNames = data.map(el => el[dimElementInside]).filter((v, i, a) => a.indexOf(v) === i)
    let namesDataMultiple = data.map(el => el[dimElementInside])
      .filter((v, i, a) => !(a.indexOf(v) === i))
      .filter((v, i, a) => a.indexOf(v) === i)

    /* if (typeof data[0].colorElement === 'string') {
      let uniqueStringColors = data.map(el => el.colorElement).filter((v, i, a) => a.indexOf(v) === i)
      data = data.map(el => {
        el.colorElement = uniqueStringColors.indexOf(el.colorElement)/uniqueStringColors.length
        return el;
      })
    } */


    // Separation of vertical and horizontal elements
    let horizontalElementsData = []
    let verticalElementsData = []
    let singleElementsData = data.filter(el => namesDataMultiple.indexOf(el[dimElementInside]) === -1)
    namesDataMultiple.forEach(nameInsideElement => {
      let rowsData = []
      let rows = []
      data.filter(item => item[dimElementInside] === nameInsideElement)
        .forEach(el => {
          rows.push(el[dimRow])
          rowsData.push(el)
        })

      let colorElement = data.filter(item => item[dimElementInside] === nameInsideElement)
        .map(el => el.colorElement)[0]

      uniqueRowsName = rows.filter((v, i, a) => a.indexOf(v) === i)
        .sort((a, b) => {
          return rowsName.indexOf(a) - rowsName.indexOf(b)
        })

      uniqueRowsName.forEach(rowName => {
        let cols = []
        rowsData.filter(data => data[dimRow] === rowName)
          .forEach(el => {
            cols.push(el[dimColumn])
          })
        let nameUniqueCols = cols.filter((v, i, a) => a.indexOf(v) === i)
          .sort((a, b) => {
            return columnsName.indexOf(a) - columnsName.indexOf(b)
          })

        if (nameUniqueCols.length > 1) {
          let cs = [nameUniqueCols[0]]
          for (let l=1; l<nameUniqueCols.length; l++) {
            if (columnsName.indexOf(nameUniqueCols[l]) - columnsName.indexOf(nameUniqueCols[l - 1]) > 1) {
              // columns not next to each other
              if (cs.length > 1) {
                // element is on multiple columns next to each other
                horizontalElementsData.push({
                  nameInsideElement: nameInsideElement,
                  columnsName: cs,
                  rowName: rowName,
                  colorElement: colorElement
                })
              }
              else {
                let dataElement = {}
                dataElement[dimElementInside] = nameInsideElement
                dataElement[dimColumn] = cs[0]
                dataElement[dimRow] = rowName
                dataElement.colorElement = colorElement
                singleElementsData.push(dataElement)
              }
              cs = [nameUniqueCols[l]]
              if (l === nameUniqueCols.length - 1) {
                let dataElement = {}
                dataElement[dimElementInside] = nameInsideElement
                dataElement[dimColumn] = cs[0]
                dataElement[dimRow] = rowName
                dataElement.colorElement = colorElement
                singleElementsData.push(dataElement)
              }
            }
            else {
              cs.push(nameUniqueCols[l])
              if (l === nameUniqueCols.length - 1) {
                horizontalElementsData.push({
                  nameInsideElement: nameInsideElement,
                  columnsName: cs,
                  rowName: rowName,
                  colorElement: colorElement
                })
              }
            }
          }
        }
        else {
          let r = []
          let nameCol = nameUniqueCols[0]
          r = rowsData.filter(el => el[dimColumn] === nameCol)
            .map(el => el[dimRow])
            .filter((v, i, a) => a.indexOf(v) === i)
            .sort((a, b) => {
              return rowsName.indexOf(a) - rowsName.indexOf(b)
            })

          if (r.length > 1) {
            let rs = [r[0]]
            for (let l=1; l<r.length; l++) {
              if (rowsName.indexOf(r[l]) - rowsName.indexOf(r[l - 1]) > 1) {
                // rows not next to each other
                if (rs.length > 1) {
                  // element is on multiple rows next to each other
                  verticalElementsData.push({
                    nameInsideElement: nameInsideElement,
                    columnName: nameCol,
                    rowsName: rs,
                    colorElement: colorElement
                  })
                }
                else {
                  let dataElement = {}
                  dataElement[dimElementInside] = nameInsideElement
                  dataElement[dimColumn] = nameCol
                  dataElement.colorElement = colorElement
                  dataElement[dimRow] = rs[0]

                  // Check if element already in singleElementsData
                  let stringSingElData = singleElementsData.map(el => JSON.stringify(el))
                  if (stringSingElData.indexOf(JSON.stringify(dataElement)) === -1) {
                    singleElementsData.push(dataElement)
                  }
                }
                rs = [r[l]]
                if (l === r.length - 1) {
                  let dataElement = {}
                  dataElement[dimElementInside] = nameInsideElement
                  dataElement[dimColumn] = nameCol
                  dataElement[dimRow] = rs[0]
                  dataElement.colorElement = colorElement

                  // Check if element already in singleElementsData
                  let stringSingElData = singleElementsData.map(el => JSON.stringify(el))
                  if (stringSingElData.indexOf(JSON.stringify(dataElement)) === -1) {
                    singleElementsData.push(dataElement)
                  }
                }
              }
              else {
                rs.push(r[l])
                if (l === r.length - 1) {
                  verticalElementsData.push({
                    nameInsideElement: nameInsideElement,
                    columnName: nameCol,
                    rowsName: rs,
                    colorElement: colorElement
                  })
                }
              }
            }
          }
          else {
            // those element's columns and rows are not next to each other
            // They will therefore be considered as two distinct elements
            let dataElement = {}
            dataElement[dimElementInside] = nameInsideElement
            dataElement[dimColumn] = nameCol
            dataElement[dimRow] = r[0]
            dataElement.colorElement = colorElement
            singleElementsData.push(dataElement)
          }
        }
      })
    })

    // Data multiple horizontal elements
    horizontalElementsData = horizontalElementsData.filter((v, i, fullTable) => {
      let stringifiedObjectsTable = fullTable.map(el => JSON.stringify(el))
      return stringifiedObjectsTable.indexOf(JSON.stringify(v)) === i
    })
    // Data multiple vertical elements
    verticalElementsData = verticalElementsData.filter((v, i, fullTable) => {
      let stringifiedObjectsTable = fullTable.map(el => JSON.stringify(el))
      return stringifiedObjectsTable.indexOf(JSON.stringify(v)) === i
    })

    console.log('horiz', horizontalElementsData)
    console.log('vert', verticalElementsData)
    console.log('single', singleElementsData)

    // Create color domain
    colors.domain(horizontalElementsData.concat(verticalElementsData, singleElementsData), el => el.colorElement)

    // Create position data for grid
    let gridData = createGridData(rowsName.length + 1,
      columnsName.length + 1,
      (width - 2) / (columnsName.length + 1),
      (height - 1) / (rowsName.length + 1))
    // Append names of row and columns in data
    gridData[0].forEach((col, indexCol) => col.name = colNamesPlusEmpty[indexCol]) // name columns
    for(let i=1; i<gridData.length; i++) { // name rows
      let currentRow = gridData[i]
      currentRow[0].name = rowsName[i - 1]
    }

    for(let i=1; i<rowsName.length + 1; i++) {
      let currentRow = gridData[i]
      for (let j=0; j<columnsName.length; j++) {
        let currentCell = currentRow[j + 1]
        currentCell.rowName = rowsName[i - 1]
        currentCell.columnName = columnsName[j]
        // currentCell.colorElement =
      }
    }

    console.log('gridData', gridData)

    /* Creation of the underneath grid */
    divGridGraph.append('g')
      .attr('id', 'grid')

    let grid = d3.select('#grid')
      .append('svg')
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.bottom + margin.top)
      .style("margin-left", -margin.left + "px")
      .style("margin.right", -margin.right + "px")

    // Create g for each row
    let row = grid.selectAll(".Row")
      .data(gridData)
      .enter()
      .append("g")
      .attr("class", "Row");

    // Create all cells
    let cell = row.selectAll(".Cell")
      .data(function(row) { return row; })
      .enter()
      .append('g')
      .attr('class', 'Cell')

    // Create rectangles for cells
    let rowIndex = 0
    cell.append("rect")
      .attr("class", (rect, i) => {
        let cellClass = 'insideTableRect'
        if (i%(columnsName.length + 1) === 0) {
          // Cell is row name
          cellClass = 'rowNameRect'
        }
        if (rowIndex === 0) {
          // Cell is column name
          cellClass = (i === 0)?'firstRect':'columnNameRect'
          rowIndex = (i === columnsName.length)?(rowIndex + 1):rowIndex
        }

        return cellClass
      })
      .attr("x", function(d) { return d.x; })
      .attr("y", function(d) { return d.y; })
      .attr("width", function(d) { return d.width; })
      .attr("height", function(d) { return d.height; })
      .style("fill", "#fff")
      .style("stroke", "#222")

    // Adjust style of table
    d3.selectAll('.rowNameRect')
      .style('fill', '#668cff')
      .style('stroke', "#ffffff")

    d3.selectAll('.columnNameRect')
      .style('fill', '#668cff')
      .style('stroke', "#ffffff")

    d3.selectAll('.insideTableRect')
      .style('fill', '#d9d9d9')
      .style('stroke', "#ffffff")

    d3.selectAll('.firstRect')
      .style('opacity', '0')
      .style('filter', 'alpha(opacity=0)')

    // Append name of rows and columns
    cell.append('text')
      .attr('x', cell => cell.x + cell.width/2)
      .attr('y', cell => cell.y + cell.height/2)
      .attr("dy", ".35em")
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'central')
      .style('font-weight', 'bold')
      .text(cell => {
        if (cell.hasOwnProperty('name')) {
          return cell.name
        }
      })

    /* Create superimposed svg elements */
    // Calculation of max horizontal elements in the same cell
    let matrixVertEl = new Array(rowsName.length).fill().map(() => {
      return new Array(columnsName.length)
        .fill()
        .map(() => [0])
    })

    verticalElementsData.forEach(el => {
      el.rowsName.forEach(rowName => {
        matrixVertEl[rowsName.indexOf(rowName)][columnsName.indexOf(el.columnName)] = parseInt(matrixVertEl[rowsName.indexOf(rowName)][columnsName.indexOf(el.columnName)]) + 1
      })
    })

    let matrixHorizEl = new Array(rowsName.length).fill().map(() => {
      return new Array(columnsName.length)
        .fill()
        .map(() => [0])
    })

    horizontalElementsData.forEach(el => {
      el.columnsName.forEach(colName => {
        matrixHorizEl[rowsName.indexOf(el.rowName)][columnsName.indexOf(colName)] = parseInt(matrixHorizEl[rowsName.indexOf(el.rowName)][columnsName.indexOf(colName)]) + 1
      })
    })

    let maxCellHeight = Math.max(...matrixHorizEl.map(el => Math.max(...el))) + 1
    let maxCellWidth = Math.max(...matrixVertEl.map(el => Math.max(...el))) + 1
    let maxElementInCell = maxCellWidth * maxCellHeight

    console.log('maxCellWidth', maxCellWidth)
    console.log('maxVertElements', maxCellHeight)

    // Create a g for each cell (inCell is in front of cell, same size)
    let inCell = cell.append('g')
      .attr('class', 'InCell')
      .attr('id', inCell => {
        if (typeof inCell.rowName !== 'undefined') {
          return '' + inCell.rowName + inCell.columnName
        }
      })

    // Create a grid of <svg> to be later usable to put elements inside
    inCell.selectAll('svg')
      .data(inCell => {
        let posSvg = []
        for(let i=0; i<maxElementInCell; i++) {
          posSvg[i] = {x: inCell.x + (i%maxCellWidth)*(inCell.width/maxCellWidth),
            y: inCell.y + (Math.trunc(i/maxCellWidth))*(inCell.height/maxCellHeight),
            width: inCell.width/maxCellWidth,
            height: inCell.height/maxCellHeight,
            posInCell: i,
            colorElement: inCell.colorElement,
            rowName: inCell.rowName,
            columnName: inCell.columnName}
        }
        return posSvg
      })
      .enter()
      .append ('svg')
      .attr('isEmpty', 'true')

    // Create element inside for each item of dataset that is on more than a dimension
    verticalElementsData.forEach(vertEl => {

      let vValue = 0
      let hValue = 0
      vertEl.rowsName.forEach(function (row, i, allRows) {
        let iMiddle = Math.trunc(allRows.length/2)
        if (i === 0) {
          // Create top of element in the upper row
          let matrixSelectionUpperSvg = getCellMatrix(grid,
            '#' + vertEl.rowsName[i] + vertEl.columnName,
            maxCellWidth,
            maxElementInCell)
          // get left lower part of the cell
          for (let v = 0; v < maxCellHeight; v++) {
            for (let h = 0; h < maxCellWidth; h++) {
              if (matrixSelectionUpperSvg[v][h].attr('isEmpty') === 'true') {
                if ((h < hValue && v === vValue) || v > vValue) {
                  hValue = h
                  vValue = v
                }
              }
            }
          }

          // Create top of element
          matrixSelectionUpperSvg[vValue][hValue].append('rect')
            .attr('x', svg => svg.x + (svg.width - Math.min(svg.width, svg.height))/2)
            .attr('y', svg => svg.y + svg.height / 2)
            .attr('width', svg => Math.min(svg.width, svg.height))
            .attr('height', svg => svg.height / 2 + 3)
            .style('fill', colors() ? colors()(vertEl.colorElement) : "grey")

          matrixSelectionUpperSvg[vValue][hValue].append('circle')
            .attr('cx', svg => svg.x + svg.width / 2)
            .attr('cy', svg => svg.y + svg.height / 2)
            .attr('r', svg => Math.min(svg.width / 2, svg.height / 2))
            .attr('fill', colors() ? colors()(vertEl.colorElement) : "grey")

          matrixSelectionUpperSvg[vValue][hValue].attr('isEmpty', 'false')
        }

        else if (i>0 && i !== allRows.length -1) {
          // Create Middle parts of the element
          let matrixSelectionMiddleSvg = getCellMatrix(grid,
            '#' + vertEl.rowsName[i] + vertEl.columnName,
            maxCellWidth,
            maxElementInCell)

          let vMiddle = (allRows.length%2===0)?0:Math.trunc(maxCellHeight / 2)

          for (let v=0; v<maxCellHeight; v++) {
            // Create the body of the element on each row of the cell
            matrixSelectionMiddleSvg[v][hValue].append('rect')
              .attr('x', svg => svg.x + (svg.width - Math.min(svg.width, svg.height))/2)
              .attr('y', svg => svg.y)
              .attr('width', svg => Math.min(svg.width, svg.height))
              .attr('height', svg => svg.height + 3)
              .style('fill', colors() ? colors()(vertEl.colorElement) : "grey")

            matrixSelectionMiddleSvg[v][hValue].attr('isEmpty', 'false')

            if (v === vMiddle && i === iMiddle) {
              // Append name of vertical element
              matrixSelectionMiddleSvg[v][hValue].append('text')
                .attr('x', svg => svg.x + svg.width / 2)
                .attr('y', svg => {
                  return (allRows.length % 2 === 0) ? svg.y : (maxCellHeight % 2 === 0) ? svg.y : (svg.y + svg.height / 2)
                })
                .attr('text-anchor', 'middle')
                .attr('alignment-baseline', 'central')
                .text(vertEl.nameInsideElement)
            }
          }
        }

        else if (i === allRows.length -1) {
          // Create the lower part of the element in the lower row
          let matrixSelectionLowerSvg = getCellMatrix(grid,
            '#' + vertEl.rowsName[i] + vertEl.columnName,
            maxCellWidth,
            maxElementInCell)

          // Create top of element
          matrixSelectionLowerSvg[0][hValue].append('rect')
            .attr('x', svg => svg.x + (svg.width - Math.min(svg.width, svg.height))/2)
            .attr('y', svg => svg.y)
            .attr('width', svg => Math.min(svg.width, svg.height))
            .attr('height', svg => svg.height / 2)
            // TODO : color elment undefined here
            .style('fill', colors() ? colors()(vertEl.colorElement) : "grey")

          matrixSelectionLowerSvg[0][hValue].append('circle')
            .attr('cx', svg => svg.x + svg.width / 2)
            .attr('cy', svg => svg.y + svg.height / 2)
            .attr('r', svg => Math.min(svg.width / 2, svg.height / 2))
            .attr('fill', colors() ? colors()(vertEl.colorElement) : "grey")

          matrixSelectionLowerSvg[0][hValue].attr('isEmpty', 'false')

          // Append name of element if it is a two rows element
          if (allRows.length === 2) {
            matrixSelectionLowerSvg[0][hValue].append('text')
              .attr('x', svg => svg.x + svg.width / 2)
              .attr('y', svg => svg.y)
              .attr('text-anchor', 'middle')
              .attr('alignment-baseline', 'central')
              .text(vertEl.nameInsideElement)
          }
        }
      })
    })

    // Create horizontal elements
    horizontalElementsData.forEach(horizEl => {
      let vValue = 0
      let hValue = 0
      horizEl.columnsName.forEach(function (col, i, allColumns) {
        let iMiddle = Math.trunc(allColumns.length/2)
        if (i === 0) {
          // Create left of element in the left column
          let matrixSelectionLeftSvg = getCellMatrix(grid,
            '#' + horizEl.rowName + horizEl.columnsName[i],
            maxCellWidth,
            maxElementInCell)
          // get right upper part of the cell
          for (let v = maxCellHeight - 1; v > -1; v--) {
            for (let h = maxCellWidth  - 1; h > -1; h--) {
              if (matrixSelectionLeftSvg[v][h].attr('isEmpty') === 'true') {
                if ((v < vValue && h === hValue) || h > hValue) {
                  hValue = h
                  vValue = v
                }
              }
            }
          }

          // Create left of element
          matrixSelectionLeftSvg[vValue][hValue].append('rect')
            .attr('x', svg => svg.x)
            .attr('y', svg => svg.y)
            .attr('width', svg => svg.width + 3)
            .attr('height', svg => svg.height)
            .style('fill', colors() ? colors()(horizEl.colorElement) : "grey")

          matrixSelectionLeftSvg[vValue][hValue].attr('isEmpty', 'false')
        }

        else if (i>0 && i !== allColumns.length -1) {
          // Create Middle parts of the element
          let matrixSelectionMiddleSvg = getCellMatrix(grid,
            '#' + horizEl.rowName + horizEl.columnsName[i],
            maxCellWidth,
            maxElementInCell)

          let hMiddle = (allColumns.length%2===0)?0:Math.trunc(maxCellWidth / 2)

          for (let h=0; h<maxCellWidth; h++) {
            // Create the body of the element on each row of the cell
            matrixSelectionMiddleSvg[vValue][h].append('rect')
              .attr('x', svg => svg.x)
              .attr('y', svg => svg.y)
              .attr('width', svg => svg.width + 3)
              .attr('height', svg => svg.height)
              .style('fill', colors() ? colors()(horizEl.colorElement) : "grey")
              .style('opacity', () => (matrixSelectionMiddleSvg[vValue][h].attr('isEmpty') === 'false')?0.5:1)

            matrixSelectionMiddleSvg[vValue][h].attr('isEmpty', 'false')
            // Append name of horizontal element
            if (i === iMiddle && h === hMiddle) {
              matrixSelectionMiddleSvg[vValue][h].append('text')
                .attr('x', svg => {
                  return (allColumns.length % 2 === 0) ? svg.x : (maxCellWidth % 2 === 0) ? svg.x : (svg.x + svg.width / 2)
                })
                .attr('y', svg => svg.y + svg.height / 2)
                .attr('text-anchor', 'middle')
                .attr('alignment-baseline', 'central')
                .text(horizEl.nameInsideElement)
            }

          }

        }

        else if (i === allColumns.length -1) {
          // Create the right part of the element in the right column
          let matrixSelectionRightSvg = getCellMatrix(grid,
            '#' + horizEl.rowName + horizEl.columnsName[i],
            maxCellWidth,
            maxElementInCell)

          // Create top of element
          matrixSelectionRightSvg[vValue][0].append('rect')
            .attr('x', svg => svg.x)
            .attr('y', svg => svg.y)
            .attr('width', svg => svg.width)
            .attr('height', svg => svg.height)
            .style('fill', colors() ? colors()(horizEl.colorElement) : "grey")
            .style('opacity', () => (matrixSelectionRightSvg[vValue][0].attr('isEmpty') === 'false')?0.5:1)

          matrixSelectionRightSvg[vValue][0].attr('isEmpty', 'false')

          // Append name of element if it is a two rows element
          if (allColumns.length === 2) {
            matrixSelectionRightSvg[vValue][0].append('text')
              .attr('x', svg => svg.x)
              .attr('y', svg => svg.y + svg.height / 2)
              .attr('text-anchor', 'middle')
              .attr('alignment-baseline', 'central')
              .text(horizEl.nameInsideElement)
          }
        }
      })
    })

    // Create single elements
    singleElementsData.forEach(element => {
      let matrixSelectionSvg = getCellMatrix(grid,
        '#' + element[dimRow] + element[dimColumn],
        maxCellWidth,
        maxElementInCell)

      let xCenter = maxCellWidth / 2
      let yCenter = maxCellHeight / 2
      let dist = Math.pow(Math.pow(xCenter, 2) + Math.pow(yCenter, 2), 0.5)
      let iRow = 0
      let jCol = 0

      matrixSelectionSvg.forEach((row, i) => {
        row.forEach((cell, j) => {
          if (cell.attr('isEmpty') === 'true') {
            if ((Math.pow(Math.pow(xCenter - j - 0.5, 2) + Math.pow(yCenter - i - 0.5, 2), 0.5)) < dist) {
              iRow = i
              jCol = j
              dist = Math.pow(Math.pow(xCenter - jCol - 0.5, 2) + Math.pow(yCenter - iRow - 0.5, 2), 0.5)
            }
          }
        })
      })

      matrixSelectionSvg[iRow][jCol].append('circle')
        .attr('cx', svg => svg.x + svg.width/2)
        .attr('cy', svg => svg.y + svg.height/2)
        .attr('r', svg => Math.min(svg.height/2, svg.width/2))
        .attr('fill', colors() ? colors()(element.colorElement) : "grey")

      matrixSelectionSvg[iRow][jCol].append('text')
        .attr('x', svg => svg.x + svg.width/2)
        .attr('y', svg => svg.y + svg.height/2)
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'central')
        .text(element[dimElementInside])

      matrixSelectionSvg[iRow][jCol].attr('isEmpty', 'false')
    })

    console.log('sel', getCellMatrix(grid, '#Brand1Finance', maxCellWidth, maxElementInCell))

    // function that creates a grid
// http://www.cagrimmett.com/til/2016/08/17/d3-lets-make-a-grid.html
    function createGridData (numberRow, numberColumn, cellWidth, cellHeight) {
      let data = [];
      let xpos = 1; //starting xpos and ypos at 1 so the stroke will show when we make the grid below
      let ypos = 1;
      let width = cellWidth;
      let height = cellHeight;

      // iterate for rows
      for (let row = 0; row < numberRow; row++) {
        data.push( [] );

        // iterate for cells/columns inside rows
        for (let column = 0; column < numberColumn; column++) {
          data[row].push({
            x: xpos,
            y: ypos,
            width: width,
            height: height
          })
          // increment the x position. I.e. move it over by width (width variable)
          xpos += width;
        }
        // reset the x position after a row is complete
        xpos = 1;
        // increment the y position for the next row. Move it down by height (height variable)
        ypos += height;
      }
      return data;
    }

    // Returns matrix of selection for each svg of the table cell
    function getCellMatrix (selection, id, horizElements, totalElements) {
      let matrix = new Array(Math.trunc(totalElements/horizElements)).fill().map(() => [])
      selection.select(id).selectAll('svg')
        .each(function (svg, i) {
          matrix[Math.trunc(i/horizElements)][i%horizElements] = d3.select(this)
        })

      return matrix
    }

    // function that returns a color over a radient depending on the weight (between 0 and 1)
    function pickHex(weight, color1, color2) {
      let w1 = weight;
      let w2 = 1 - w1;
      let rgb = [Math.round(color1.red * w1 + color2.red * w2),
        Math.round(color1.green * w1 + color2.green * w2),
        Math.round(color1.blue * w1 + color2.blue * w2)];
      return 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
    }
  })
})();