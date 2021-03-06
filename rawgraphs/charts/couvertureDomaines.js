(function () {
  /* Creation of model */
  let model = raw.model()

  let dimColumnsRaw = model.dimension()
    .title('Colonnes')
    .types(String)
    .required(1)

  let dimRowsRaw = model.dimension()
    .title('Lignes')
    .types(String)
    .required(1)

  let dimNameElements = model.dimension()
    .title('Elements')
    .types(String)
    .required(1)

  let dimColorElements = model.dimension()
    .title('Couleur des éléments')
    .types(String, Number)

  /* Map function */
  let nameDimensions = {}
  let checkboxesColumnsDefined = false
  let currentDimColumnName
  let checkboxesColumnsName = [] // array containing the titles of the checkboxes, which are columns' name
  let checkboxesColumns = [] // array containing the instances of checkboxes
  let allColumns = []

  model.map(data => {
    let columnsNameAlreadyDefined = false

    let mapFunction =  data.map((el, i) => {

      if (i === 0) {
        nameDimensions = {
          nameDimNameElements: dimNameElements()[0], // ex: Code SA
          nameColumnsRaw: dimColumnsRaw()[0], // ex: Sous-domaine
          nameDimRowsRaw: dimRowsRaw()[0], // ex: Réseau
          nameDimColorElements: (dimColorElements())?dimColorElements()[0]:false
        }

        checkboxesColumnsDefined = (dimColumnsRaw()[0] === currentDimColumnName)
      }

      let elementData = {
        dimRow: el[dimRowsRaw()],
        dimColumn: el[dimColumnsRaw()],
        dimElementInside: el[dimNameElements()],
        dimColorElements: el[dimColorElements()]
      }

      let columnHasNotBeenSeenAlready = checkboxesColumnsName.indexOf(el[dimColumnsRaw()]) === -1

      if (columnHasNotBeenSeenAlready && !checkboxesColumnsDefined) checkboxesColumnsName.push(el[dimColumnsRaw()])

      return elementData
    })

    if (!checkboxesColumnsDefined) {
      let diff = checkboxesColumns.length - checkboxesColumnsName.length

      for (let indexCol = 0; indexCol < checkboxesColumnsName.length; indexCol++) {
        let checkboxAlreadyCreated = (!!checkboxesColumns[indexCol])

        if (checkboxAlreadyCreated) {
          checkboxesColumns[indexCol]
            .title(checkboxesColumnsName[indexCol])
            .defaultValue(true)
        }

        else {
          checkboxesColumns[indexCol] = chart.checkbox()
            .title(checkboxesColumnsName[indexCol])
            .defaultValue(true)
        }
      }

      for (let indexCol = checkboxesColumns.length - diff; indexCol < checkboxesColumns.length; indexCol++) {
          checkboxesColumns [indexCol].title('No title')
            .defaultValue(true)
      }

      allColumns = checkboxesColumnsName

      checkboxesColumnsName = []
      currentDimColumnName = dimColumnsRaw()[0]
    }

    return mapFunction
  })

  /* Definition of chart options */
  let chart = raw.chart()
  chart.model(model)
  chart.title('Couverture de domaines')
    .description('Couverture de capacités ou de domaines par des Services Applicatifs (SA)')
    .chartSource('aev')
    .thumbnail("imgs/couverture.png")

  let rawWidth = chart.number()
    .title('Largeur')
    .defaultValue(700)

  let rawHeight = chart.number()
    .title('Hauteur')
    .defaultValue(600)

  let elementsDisposalManner = chart.list()
    .title("Affichage des éléments")
    .values(['Horizontalement et verticalement', 'Eléments courts'])
    .defaultValue('Horizontalement et verticalement')

  let colors  = chart.color()
    .title('Echelle de couleurs')

  let fontSizeCoeff10 = chart.number()
    .title('Taille de police')
    .defaultValue(10)

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
  chart.draw(function(selection, dataRaw) {
    let dimColumn = 'dimColumn'
    let dimRow = 'dimRow'
    let dimElementInside = 'dimElementInside'
    let dimColorElements = 'dimColorElements'
    let nameDimRowRaw = nameDimensions.nameDimRowsRaw
    let nameDimColorElements = nameDimensions.nameDimColorElements
    let colorsPalletColumns = ['#c0cff7', '#4170e7', '#00b0f0']
    let smallElementsDisposal = (elementsDisposalManner() === 'Eléments courts')
    let checkboxesColumnsValues = checkboxesColumns.map(checkbox => checkbox())
    let columnsName = allColumns.filter((col, indexColumn) => checkboxesColumnsValues[indexColumn])
    let colorDimensionDefined = (nameDimColorElements)
    let fontSizeCoeff1 = fontSizeCoeff10() / 10

    let data = dataRaw.filter(el => {
      let elHasAWantedColumn = columnsName.indexOf(el[dimColumn]) !== -1
      if (elHasAWantedColumn) return el
    })

    // Create color domain for elements
    colors.domain(data, el => el[dimColorElements])

    let margin = {top: 5, right: 5, bottom: 5, left: 5},
      graphWidth =  +rawWidth() - 5,
      graphHeight = +rawHeight() - margin.top - margin.bottom

    selection
      .attr("width", graphWidth + margin.left + margin.right + 2 + 'px')
      .attr("height", graphHeight + margin.bottom + margin.top + 'px')
      .style("margin-left", -margin.left + "px")
      .style("margin-right", -margin.right + "px")

    let divGridGraph = selection.append('svg')
      .attr('class', 'gridGraph')

    /* Retrieve data from dataset */
    // Create columns' and rows' name arrays
    let colNamesPlusEmpty = ['', ...columnsName]
    let columnsColors = []
    for (let col = 0; col < columnsName.length; col++) {
      columnsColors.push(colorsPalletColumns[col % colorsPalletColumns.length])
    }
    let rowsName = data.map(el => el[dimRow]).filter((v, i, a) => a.indexOf(v) === i)

    // Create dataset of elements that are on multiple dimensions
    let ElementInsideNames = data.map(el => el[dimElementInside]).filter((v, i, a) => a.indexOf(v) === i)

    // Separation of vertical, horizontal and single elements
    let verticalElementsData = [], horizontalElementsData = [], singleElementsData = []
    if (!smallElementsDisposal) {
      // If we authorize big horizontal or vertical elements
      let separatedData = createMultiSingleData (data, dimRow, dimColumn, dimElementInside)
      verticalElementsData = separatedData[0]
      horizontalElementsData = separatedData[1]
      singleElementsData = separatedData[2]

      verticalElementsData.push(...singleElementsData.map(el => {
        let rowsSingleElement = []
        rowsSingleElement.push(el[dimRow])
        return {
          nameInsideElement: el[dimElementInside],
          columnName: el[dimColumn],
          rowsName: rowsSingleElement,
          dimColorElements: el[dimColorElements]
        }
      }))

      console.log('horiz', horizontalElementsData)
      console.log('vert', verticalElementsData)
      console.log('single', singleElementsData)
    }

    else {
      // if we only want elements to be small and each in one cell
      horizontalElementsData = data.map(el => {
        let columnsSingleElement = []
        columnsSingleElement.push(el[dimColumn])
        return {
          nameInsideElement: el[dimElementInside],
          columnsName: columnsSingleElement,
          rowName: el[dimRow],
          dimColorElements: el[dimColorElements]
        }
      })

      horizontalElementsData = horizontalElementsData.filter((v, i, fullTable) => {
        let stringifiedObjectsTable = fullTable.map(el => JSON.stringify(el))
        return stringifiedObjectsTable.indexOf(JSON.stringify(v)) === i
      })

      console.log('singleElementsData', horizontalElementsData)
    }

    // Calculation of max horizontal elements in the same cell
    let maxHorizontalElements = getMaxHorizontalElements (horizontalElementsData, rowsName, columnsName)
    let maxVerticalElements = getMaxVerticalElements (verticalElementsData, rowsName, columnsName)
    let maxElementInCell = maxVerticalElements * maxHorizontalElements

    let closestDivisorsOfMax = getClosestDivisors(maxHorizontalElements)
    let maxXElements = closestDivisorsOfMax[0] // number of maximum elments on x axis, useful when small elements displayal
    let maxYElements = closestDivisorsOfMax[1] // number of maximum elments on y axis, useful when small elements displayal

    /* Definition of cell and element width, height, and margins */
    let marginBetweenColumns = 3
    let marginBetweenRowsOfFirstColumn = 5
    let coefWidthFirstColumn = 0.75
    let cellWidth = graphWidth / (columnsName.length + coefWidthFirstColumn) - (columnsName.length - 1) * marginBetweenColumns
    let widthFirstColumn = coefWidthFirstColumn * cellWidth
    let legendHeight = 22
    let cellHeight = (colorDimensionDefined) ?
    (graphHeight - legendHeight) / (rowsName.length + 1) :
    graphHeight / (rowsName.length + 1)
    let verticalElementsWidth = cellWidth / (maxVerticalElements + 1)
    let horizontalElementsHeight = cellHeight / (maxHorizontalElements + 1)
    let marginXVerticalElements = (cellWidth - maxVerticalElements * verticalElementsWidth) / (1 + maxVerticalElements)
    let marginYHorizontalElements = (cellHeight - maxHorizontalElements * horizontalElementsHeight) / (maxHorizontalElements + 1)
    // Same definition for small elements
    let marginXSmallElements = 3
    let marginYSmallElements = 5
    let widthSmallElements = (cellWidth - marginXSmallElements) / maxXElements - marginXSmallElements
    let heightSmallElements = (cellHeight - marginYSmallElements) / maxYElements - marginYSmallElements

    // Create position data for grid
    let gridData = createGridData(rowsName.length + 1, columnsName.length + 1, cellWidth, cellHeight)
    console.log('gridData', gridData)

    /* Creation of the underneath grid */
    drawGrid(divGridGraph, gridData)
    if (colorDimensionDefined) drawColorLegend()

    /* Create superimposed svg elements */
    // Drawing of vertical and horizontal elements
    let insideTableSel = d3.select('#insideTable')
    if (smallElementsDisposal) {
      drawElements(horizontalElementsData, insideTableSel, horizontalElementsHeight, 'small')
    } 
    else {
      drawElements(verticalElementsData, insideTableSel, verticalElementsWidth, 'vertical')
      drawElements(horizontalElementsData, insideTableSel, horizontalElementsHeight, 'horizontal')
    }

    /* Function that creates a grid */
    // http://www.cagrimmett.com/til/2016/08/17/d3-lets-make-a-grid.html
    function createGridData (numberRow, numberColumn, cellWidth, cellHeight) {
      let data = [];
      let xpos = 1; //starting xpos and ypos at 1 so the stroke will show when we make the grid below
      let ypos = 1;
      let height = cellHeight;
      let width

      // iterate for rows
      for (let row = 0; row < numberRow; row++) {
        data.push( [] );

        // iterate for cells/columns inside rows
        for (let column = 0; column < numberColumn; column++) {
          width = (column === 0) ? widthFirstColumn : cellWidth 
          data[row].push({
            x: xpos,
            y: ypos,
            width: width,
            height: height
          })
          // increment the x position. i.e. move it over by width (width variable)
          xpos += width + marginBetweenColumns
        }
        // reset the x position after a row is complete
        xpos = 1;
        // increment the y position for the next row. Move it down by height (height variable)
        ypos += height;
      }

      // Append names of row and columns in data
    data[0].forEach((col, indexCol) => col.name = colNamesPlusEmpty[indexCol]) // name columns
    for(let i=1; i<data.length; i++) { // name rows
      let currentRow = data[i]
      currentRow[0].name = rowsName[i - 1]
    }

    for(let i=1; i<rowsName.length + 1; i++) {
      let currentRow = data[i]
      for (let j=0; j<columnsName.length; j++) {
        let currentCell = currentRow[j + 1]
        currentCell.rowName = rowsName[i - 1]
        currentCell.columnName = columnsName[j]
      }
    }

    return data
    }

    function drawGrid (parentSelection, gridData) {
      parentSelection.append('g')
        .attr('id', 'grid')
        .attr('transform', 'translate(' + margin.left + ', 0)')

      let grid = d3.select('#grid')
        .append('svg')
        .attr('width', graphWidth + 'px')
        .attr('height', graphHeight + 'px')
        .attr('id', 'insideTable')

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
        .attr('id', cell =>{
          let cellIsAnInsideCell = (cell.rowName && cell.columnName)

          if (cellIsAnInsideCell) return 'rect' + rowsName.indexOf(cell.rowName) + '' + columnsName.indexOf(cell.columnName)
          else return;
        })
        .attr("x", function(d) { return d.x; })
        .attr("y", function(d) { return d.y; })
        .attr("width", function(d) { return d.width; })
        .attr("height", function(d) { return d.height; })

      // Adjust style of table
      d3.selectAll('.rowNameRect')
        .style('fill', '#b4b4b4')
        .style('stroke', "#ffffff")
        .style('stroke-width', '2px')
        .attr("x", function(d) { return d.x + marginBetweenRowsOfFirstColumn })
        .attr("y", function(d) { return d.y + marginBetweenRowsOfFirstColumn})
        .attr("width", function(d) { return d.width - 2 * marginBetweenRowsOfFirstColumn })
        .attr("height", function(d) { return d.height - 2 * marginBetweenRowsOfFirstColumn })

      d3.selectAll('.columnNameRect')
        .style('fill', (cell, indexCell) => columnsColors [indexCell % columnsColors.length])
        .style('stroke', "#ffffff")
        .style('stroke-width', '2px')
        .style('stroke-dasharray', rect => {
          return '0, ' + rect.width + ', ' +  rect.height + ', '  + rect.width + ', ' + rect.height
        })

      d3.selectAll('.insideTableRect')
        .style('fill', (cell, indexCell) => columnsColors [indexCell % columnsColors.length])
        .style('stroke', "#ffffff")
        .style('stroke-width', '2px')
        .style('stroke-dasharray', rect => {
          return '0, ' + rect.width + ', ' +  rect.height + ', '  + rect.width + ', ' + rect.height
        })

      d3.selectAll('.firstRect')
        .style('opacity', '0')
        .style('filter', 'alpha(opacity=0)')

      // Append name of rows and columns
      cell.append('text')
        .attr('x', cell => cell.x + cell.width/2)
        .attr('y', (cell, indexCell) => {
        let cellIsInFirstRow = (indexCell !== 0 && cell.hasOwnProperty('name'))
        if (cellIsInFirstRow) return cell.y + 10
        else return cell.y + cell.height/2
      })
        .attr("dy", ".35em")
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'central')
        .text(cell => {
          if (cell.hasOwnProperty('name')) {
            return cell.name
          }
        })
        .style('font-weight', 'bold')
        .style('fill', '#ffffff')
        .style('font-size', '13px')
        .style('font-family', 'Arial')
        .call(wrap) // Breakline when text too long

    // Append lines that separate rows
    let separatingLines = grid.append('g')
    .attr('class', 'separatingLinesG')
    .selectAll('separatingLine')
    .data(gridData)
    .enter()
    .append('path')
    .attr('class', 'separatingLine')
    .attr('d',(row, indexRow, allRows) => {
      let firstCellOfRow = row[0]
      let lastCellOfRow = row[row.length - 1]
      let lastRow = (indexRow === allRows.length - 1)

      let leftLineX = firstCellOfRow.x // 0.7 is to make disappear white line between rect and arrow
      let leftLineY = lastRow ? firstCellOfRow.y + cellHeight - 1.5 : firstCellOfRow.y + cellHeight
      let rightLineX = lastCellOfRow.x + cellWidth
      let rightLineY = leftLineY
      return 'M' + leftLineX + ' ' + leftLineY //Upper point of line
        + ' L' + rightLineX + ' ' + rightLineY // Bottom point of line
        + ' Z' // Close path

    })
    .style('stroke', "#000")
    .style('stroke-width', '0.3px')
    .style('stroke-dasharray', (line, index, allLines) => {
        if (index === 0 || index === allLines.length -1) return "0.4%, 0.3%"
      })

      // Append vertical lines at the left and right of the chart
      let bottomLineY = gridData[gridData.length - 1][0].y + cellHeight
      let pathFirstLine = 'M' + gridData[1][0].x + ' ' + gridData[1][0].y
      + ' L' + gridData[1][0].x + ' ' + bottomLineY // Bottom point of line
      + ' Z' // Close path
      let lastLineX = gridData[1][gridData[1].length - 1].x + cellWidth
      let pathLastLine = 'M' + lastLineX + ' ' + gridData[1][gridData[1].length - 1].y
      + ' L' + lastLineX + ' ' + bottomLineY // Bottom point of line
      + ' Z' // Close path

      grid.select('.separatingLinesG')
      .append('path')
      .attr('d', pathFirstLine)
    .style('stroke', "#000")
    .style('stroke-width', '0.3px')
    .style('stroke-dasharray', "0.4%, 0.3%")

    grid.select('.separatingLinesG')
      .append('path')
      .attr('d', pathLastLine)
    .style('stroke', "#000")
    .style('stroke-width', '0.3px')
    .style('stroke-dasharray', "0.4%, 0.3%")

    }

    /* Draw color legend */
    function drawColorLegend () {
      let colorLegendG = d3.select('.gridGraph')
      .append('g')
      .attr('class', 'colorLegend')

      colorLegendG.append('text')
      .attr('x', 0)
      .attr('y', legendHeight / 2)
      .attr('dy', '.3em')
      .text('Légende')
      .style('font-family', 'Arial')
      .style('font-size', '10px')

      let widthLegendRect = 0.70 * cellWidth
      let heightLegendRect = legendHeight - 2
      let spaceBetweenRect = 10
      // Unique values in the color domain
      let uniqueColorsValues = colors.domain().filter((v, i, a) => a.indexOf(v) === i)

      // Create all colored rectangles for legend
      for (let indexColor=0; indexColor<uniqueColorsValues.length; indexColor++) {
        colorLegendG.append('rect')
        .attr('x', 50 + indexColor * (widthLegendRect + spaceBetweenRect))
        .attr('y', 0)
        .attr('rx', 4)
        .attr('ry', 4)
        .attr('width', widthLegendRect)
        .attr('height', heightLegendRect)
        .style('fill', colors()(uniqueColorsValues[indexColor]))
        .style('stroke', 'black')
        .style('stroke-width', '2')

        colorLegendG.append('text')
        .text(uniqueColorsValues[indexColor])
        .attr('x', 50 + indexColor * (widthLegendRect + spaceBetweenRect) + widthLegendRect / 2)
        .attr('y', legendHeight / 2)
        .attr('dy', '0')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'central')
        .style('fill', '#ffffff')
        .style('font-family', 'Arial')
        .style('font-weight', 'bold')
        .style('font-size', '12px')
      }

      // Translate the whole legend horizontally
      let yTranslate = graphHeight - legendHeight + 5
      colorLegendG.attr('transform', 'translate(' + 0.75 * cellWidth + ',' + yTranslate + ')')
    }

    /* Calculate maximum of horizontal elements in the same cell */
    function getMaxHorizontalElements (horizontalElementsData, rowsName, columnsName) {
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

      return Math.max(...matrixHorizEl.map(el => Math.max(...el)))
    }

    /* Calculate maximum of vertical elements in the same cell */
    function getMaxVerticalElements (verticalElementsData, rowsaName, columnsName) {
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

      return Math.max(...matrixVertEl.map(el => Math.max(...el)))
    }

    /* Returns an array of elements data [dataVerticalElements, dataHorizontalElements, dataSingleElements]
    * dataElements : array of objects defining the position of elements
     * Ex : [{"codeSA": "codeSA1", "Branch": "Finance", "CompanyBrand": "Brand1" }]
     * with "Branch" being the column's name and "CompanyBrand" the row's one */
    function createMultiSingleData (dataElements, nameDimRow, nameDimColumn, nameDimElementInside) {
      // Create array of elements that are in multiple cell or column
      let namesDataMultiple = dataElements.map(el => el[nameDimElementInside])
        .filter((v, i, a) => !(a.indexOf(v) === i))
        .filter((v, i, a) => a.indexOf(v) === i)

      let horizontalElementsData = []
      let verticalElementsData = []
      let singleElementsData = dataElements.filter(el => namesDataMultiple.indexOf(el[nameDimElementInside]) === -1)

      let colorElement = ''

      namesDataMultiple.forEach(nameInsideElement => {
        let rowsData = []
        let rows = []
        data.filter(item => item[nameDimElementInside] === nameInsideElement)
          .forEach(el => {
            rows.push(el[nameDimRow])
            rowsData.push(el)
            colorElement = (nameDimColorElements)?el[dimColorElements]:0.5
          })

        uniqueRowsName = rows.filter((v, i, a) => a.indexOf(v) === i)
          .sort((a, b) => {
            return rowsName.indexOf(a) - rowsName.indexOf(b)
          })

        uniqueRowsName.forEach(rowName => {
          let cols = []
          rowsData.filter(data => data[nameDimRow] === rowName)
            .forEach(el => {
              cols.push(el[nameDimColumn])
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
                    dimColorElements: colorElement
                  })
                }
                else {
                  let dataElement = {}
                  dataElement[nameDimElementInside] = nameInsideElement
                  dataElement[nameDimColumn] = cs[0]
                  dataElement[nameDimRow] = rowName
                  dataElement[dimColorElements] = colorElement
                  singleElementsData.push(dataElement)
                }
                cs = [nameUniqueCols[l]]
                if (l === nameUniqueCols.length - 1) {
                  let dataElement = {}
                  dataElement[nameDimElementInside] = nameInsideElement
                  dataElement[nameDimColumn] = cs[0]
                  dataElement[nameDimRow] = rowName
                  dataElement[dimColorElements] = colorElement
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
                    dimColorElements: colorElement
                  })
                }
              }
            }
          }
          else {
            let r = []
            let nameCol = nameUniqueCols[0]
            r = rowsData.filter(el => el[nameDimColumn] === nameCol)
              .map(el => el[nameDimRow])
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
                      dimColorElements: colorElement
                    })
                  }
                  else {
                    let dataElement = {}
                    dataElement[nameDimElementInside] = nameInsideElement
                    dataElement[nameDimColumn] = nameCol
                    dataElement[nameDimRow] = rs[0]
                    dataElement[dimColorElements] = colorElement

                    // Check if element already in singleElementsData
                    let stringSingElData = singleElementsData.map(el => JSON.stringify(el))
                    if (stringSingElData.indexOf(JSON.stringify(dataElement)) === -1) {
                      singleElementsData.push(dataElement)
                    }
                  }
                  rs = [r[l]]
                  if (l === r.length - 1) {
                    let dataElement = {}
                    dataElement[nameDimElementInside] = nameInsideElement
                    dataElement[nameDimColumn] = nameCol
                    dataElement[nameDimRow] = rs[0]
                    dataElement[dimColorElements] = colorElement

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
                      dimColorElements: colorElement
                    })
                  }
                }
              }
            }
            else {
              // those element's columns and rows are not next to each other
              // They will therefore be considered as two distinct elements
              let dataElement = {}
              dataElement[nameDimElementInside] = nameInsideElement
              dataElement[nameDimColumn] = nameCol
              dataElement[nameDimRow] = r[0]
              dataElement[dimColorElements] = colorElement
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

      return [verticalElementsData, horizontalElementsData, singleElementsData]
    }

    /* Create an array of objects, each one of them contains all the data necessary to define an element visually  */
    function createElementsPositionData (elementsData, elementDimension, typeElement) {
      let dataElements = []
      let dataElement = {}
      let elementIsSingle

      elementsData.forEach(element => {
        let elementIsVertical = (element.hasOwnProperty('rowsName'))

        // Select the cell where the element should have his first extremity
        let idCellBeginning = (elementIsVertical)?
          '#rect' + rowsName.indexOf(element.rowsName[0]) + '' + columnsName.indexOf(element.columnName):
          '#rect' + rowsName.indexOf(element.rowName) +  '' + columnsName.indexOf(element.columnsName[0])

        let cellBeginning = getSelectionCellData(idCellBeginning)
        let xBeginning = cellBeginning.x
        let yBeginning = cellBeginning.y

        // Select the cell where the element should have his end extremity
        let idCellEnd = (elementIsVertical)?
          '#rect' + rowsName.indexOf(element.rowsName[element.rowsName.length - 1]) + '' +  columnsName.indexOf(element.columnName):
          '#rect' + rowsName.indexOf(element.rowName) + '' + columnsName.indexOf(element.columnsName[element.columnsName.length - 1])

        let cellEnd = getSelectionCellData(idCellEnd)
        let xEnd = cellEnd.x
        let yEnd = cellEnd.y
        let cellWidth = cellEnd.width
        let cellHeight = cellEnd.height

        let xCellCenter = xBeginning + cellWidth / 2
        let yCellCenter = yBeginning + cellHeight / 2

        let widthElement = (elementIsVertical)?
          elementDimension :
          smallElementsDisposal ?
          widthSmallElements :
          xEnd - xBeginning + cellWidth - 20 // That case means element is horizontal

        let heightElement = (elementIsVertical)?
          yEnd - yBeginning + cellHeight - 20 :
          smallElementsDisposal ?
          heightSmallElements :
          elementDimension

        dataElement = {
          x: (elementIsVertical)?xBeginning + marginXVerticalElements: smallElementsDisposal ? xBeginning + marginXSmallElements : xBeginning + 10,
          y: (elementIsVertical)?yBeginning + 5 : smallElementsDisposal ? yBeginning + marginYSmallElements : yBeginning + marginYHorizontalElements,
          size: [widthElement, heightElement],
          nameInsideElement: (elementIsSingle)?element[dimElementInside]:element.nameInsideElement,
          colorElement: nameDimColorElements ? colors()(element[dimColorElements]) : '#426bb0'
        }

        if (elementIsVertical) {
          dataElement.rowsName = element.rowsName
          dataElement.columnName = element.columnName
        }

        else {
          dataElement.rowName = element.rowName
          dataElement.columnsName = element.columnsName
        }

        dataElements.push(dataElement)
      })

      // Changes rectangles position so there is no overlapping and each element is on one row or one column
      if (typeElement === 'vertical') moveToRightPlaceVerticalElements(dataElements)
      else if (typeElement === 'horizontal') moveToRightPlaceHorizontalElements(dataElements)
      else moveToRightPlaceSmallElements(dataElements)

      return dataElements
    }

    /* Function to draw all elements on the graph
    * typeOfElement can be 'vertical' or 'horizontal */
    function drawElements(elementsData, insideTableSelection, elementDimension, typeElement) {
      let dataElements = createElementsPositionData(elementsData, elementDimension, typeElement)

      let elementsSpace = insideTableSelection.append('svg')
        .attr('class', 'superimposedElementsSpace')

      let dragRectangle = d3.drag()
        .on("start", dragstarted)
        .on("drag", rectangleDragged)
        .on("end", dragended)

      dataElements.forEach((dataElement, indexElement) => {
        dataElement.xCenter = dataElement.x + dataElement.size[0] / 2
        dataElement.yCenter = dataElement.y + dataElement.size[1] / 2

        let elementSelection = elementsSpace.selectAll('#' + typeElement + 'Element' + indexElement)
          .data([dataElement])
          .enter()
          .append('g')
          .attr('class', 'element')
          .attr('id', '' + typeElement + 'Element' + indexElement)

        elementSelection.append('rect')
          .attr('x', element => element.x)
          .attr('y', element => element.y)
          .style('fill', element => element.colorElement)
          .attr('class', element => element.nameInsideElement)
          .style('stroke', '#ffffff')
          .call(dragRectangle)

        elementSelection.append('text')
          .attr('dy', '.3em')
          .text(element => element.nameInsideElement)
          .attr('text-anchor', 'middle')

        elementSelection.select('rect')
          .attr('width', element => element.size[0])
          .attr('height', element => element.size[1])

        elementSelection.select('text')
          .attr('x', element => element.xCenter)
          .attr('y', element => element.yCenter)
          .style('fill', '#ffffff')
          .style('font-family', 'Arial')
          .style('font-size', 10 * fontSizeCoeff1 + 'px')
          .style('font-weight', 'bold')
      })
    }

    function dragstarted(d) {
      d3.select(this.parentNode).raise().classed("active", true);
    }

    function rectangleDragged (d) {
      d3.select(this.parentNode).select('rect')
        .attr("x", d.x = d3.event.x)
        .attr("y", d.y = d3.event.y)

      d3.select(this.parentNode).select('text')
        .attr("x", d.xCenter = d3.event.x + d.size[0] / 2)
        .attr("y", d.yCenter = d3.event.y + d.size[1] / 2)
    }

    function circleDragged(d) {
      d3.select(this.parentNode).select('circle')
        .attr("cx", d.x = d3.event.x)
        .attr("cy", d.y = d3.event.y)

      d3.select(this.parentNode).select('text')
        .attr("x", d.x = d3.event.x)
        .attr("y", d.y = d3.event.y)
    }

    function dragended(d) {
      d3.select(this.parentNode).classed("active", false);
    }

    /* Creates force simulation to avoid overlapping of elements
     * and a force simulation to ensure each element is not out of a row or a column */
    function moveToRightPlaceVerticalElements (elementsData) {
      console.log('elents data in move to right place vert', elementsData)
      let elementsToPlaceInColumns
      // For each column, look for elements
      columnsName.forEach(column => {
        elementsToPlaceInColumns = elementsData.filter(el => el.columnName === column)
        let elementsToPlaceInCell
        // widthsAlreadyUsed is an array which indexes are the indexes of the rows of the table and which values are
        // arrays of already used widths for those specific rows
        let widthsAlreadyUsed = new Array(rowsName.length).fill().map(() => [])

        // For each row in a column check for elements
        rowsName.forEach((row, indexRow) => {
          elementsToPlaceInCell = elementsToPlaceInColumns.filter(el => el.rowsName.indexOf(row) !== -1)

          let element1
          for (let indexEl = 0; indexEl<elementsToPlaceInCell.length; indexEl++) {
            element1 = elementsToPlaceInCell[indexEl]

            // while width is already used
            while (widthsAlreadyUsed[indexRow].indexOf(element1.x) !== -1) {
              element1.x += verticalElementsWidth + marginXVerticalElements
            }

            for (let i=indexRow; i<indexRow + element1.rowsName.length; i++) {
              // set the width in each cell where element1 is as used widths
              widthsAlreadyUsed[i].push(element1.x)
            }

            elementsToPlaceInColumns.splice(elementsToPlaceInColumns.indexOf(element1), 1) // Element has been placed
          }
        })
      })
    }

    /* Changes y position of all elements in elementsData to avoid overlapping */
    function moveToRightPlaceHorizontalElements (elementsData) {
      let elementsToPlaceInRow
      console.log('elents data in move to right place horiz', elementsData)
      // For each row, look for elements
      rowsName.forEach(row => {
        elementsToPlaceInRow = elementsData.filter(el => el.rowName === row)
        let elementsToPlaceInCell
        // heightsAlreadyUsed is an array which indexes are the indexes of the years of the roadmap and which values are
        // arrays of already used heights for those years
        let heightsAlreadyUsed = new Array(columnsName.length).fill().map(() => [])

        // For each column in a row check for elements
        columnsName.forEach((column, indexCol) => {
          elementsToPlaceInCell = elementsToPlaceInRow.filter(el => el.columnsName.indexOf(column) !== -1)

          let element1
          for (let indexEl = 0; indexEl<elementsToPlaceInCell.length; indexEl++) {
            element1 = elementsToPlaceInCell[indexEl]

            // while height is already used
            while (heightsAlreadyUsed[indexCol].indexOf(element1.y) !== -1) {
              element1.y += horizontalElementsHeight + marginYHorizontalElements
            }

            for (let i=indexCol; i<indexCol + element1.columnsName.length; i++) {
              // set the heights in each cell where element1 is as used heights
              heightsAlreadyUsed[i].push(element1.y)
            }

            elementsToPlaceInRow.splice(elementsToPlaceInRow.indexOf(element1), 1) // Element has been placed
          }
        })
      })
    }

    /* Changes x and y position of all small elements in elementsData to avoir overlapping */
    function moveToRightPlaceSmallElements (elementsData) {
      let alreadyUsedCoordinates = {} // Dictionary of already used coordinates. Keys are the x-axis values and Values are arrays of the y-axis values
      let currentElementX
      let currentElementY
      let isNewX
      let isAlreadyUsedCoordinates
      let isMaxXElements
      let countXElements
      let stringCurrentElementX
      let initialX

      elementsData.forEach ((element) => {
        initialX = element.x
        currentElementX = element.x
        currentElementY = element.y
        countXElements = 1
        stringCurrentElementX = currentElementX.toString()
        isNewX = (Object.keys(alreadyUsedCoordinates).indexOf(stringCurrentElementX) === -1)

        if (isNewX) alreadyUsedCoordinates[currentElementX] = [] // Add the new x value to alreadyUsed Object and initiate the y values array for this x

        isAlreadyUsedCoordinates = (alreadyUsedCoordinates[currentElementX].indexOf(currentElementY) !== -1)

        while (isAlreadyUsedCoordinates) {
          isMaxXElements = (countXElements === maxXElements)

          if (!isMaxXElements) {
            // move element to the right
            currentElementX += widthSmallElements + marginXSmallElements
            countXElements++
            stringCurrentElementX = currentElementX.toString()
            isNewX = (Object.keys(alreadyUsedCoordinates).indexOf(stringCurrentElementX) === -1)
            if (isNewX) alreadyUsedCoordinates[currentElementX] = []
          }

          else {
            // Move element down
            currentElementX = initialX
            currentElementY += heightSmallElements + marginYSmallElements
            countXElements = 1
          }

          isAlreadyUsedCoordinates = (alreadyUsedCoordinates[currentElementX].indexOf(currentElementY) !== -1)
        }

        // Coordinates are not used anymore so we assign them to the element
        element.x = currentElementX
        element.y = currentElementY
        alreadyUsedCoordinates[currentElementX] = [...alreadyUsedCoordinates[currentElementX], currentElementY]
      })
    }

    /* Function that returns the selection cell bounded data (contains x, y, width, height) */
    function getSelectionCellData (idCell) {
      return d3.selectAll('.Row').selectAll('.Cell').select(idCell).datum()
    }

    function wrap(text) {
    text.each(function() {
      let rectParent = d3.select(this.parentNode).select('rect')
      var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        x = text.attr('x'),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > rectParent.attr('width') - 3) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
        }
      }

      let centeredText = (rectParent.attr('class') === 'rowNameRect')

      if (centeredText) {
        let yTranslation = (lineNumber * 16) / 2 // 16 is because 1em = 16px
        text.attr('transform', 'translate(0, -' + yTranslation + ')')
      }
    });
  }

  /* Function that returns the two biggest divisors which, when multiplied together, are equal to given int */
  function getClosestDivisors (myInt) {
    let intTest = Math.ceil(Math.sqrt(myInt))
    while (myInt % intTest !== 0) {
      intTest++
    }
    return [intTest, myInt / intTest] // [biggerDivisor, smallestDivisor]
  }

  })
})();