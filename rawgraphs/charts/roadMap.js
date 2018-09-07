(function () {
  /* Creation of model */
  let model = raw.model()

  let dimYearsRaw = model.dimension()
    .title('Years data')
    .types(String, Number)
    .multiple(true)
    .required(1)

  let dimFirstColumn = model.dimension()
    .title('Name First Column')
    .types(String)
    .required(1)

  let dimRowRaw = model.dimension()
    .title('Name Rows')
    .types(String)
    .required(1)

  let dimNameElements = model.dimension()
    .title('Name of Elements')
    .types(String)
    .required(1)

  let dimColorElements = model.dimension()
    .title('Color of Elements')
    .types(String, Number)

  /* Map function */
  let nameDimensions = {}
  let possibleFirstColumnValues = []
  let currentFirstColumnName
  let wantedFirstColumnDefined = false

  model.map((data, index) => {
    let nameYearsArray = dimYearsRaw()
    let unformattedNameYears = dimYearsRaw()
    let mapFunction = data.map((el, i) => {

      if (i === 0) {
        nameDimensions = {
          nameDimNameElements: dimNameElements()[0], // ex: Projet
          nameColumnsRaw: nameYearsArray, // ex: ['2016', '2017', '2018', '>2018']
          nameDimRowRaw: dimRowRaw()[0], // ex : Sous-domaine
          nameDimFirstColumn: (dimFirstColumn())?dimFirstColumn()[0]:false, // ex : axe strat
          nameDimColorElements: (dimColorElements())?dimColorElements()[0]:false
        }

        wantedFirstColumnDefined = (dimFirstColumn()[0] === currentFirstColumnName)
      }

      let allYearsData = []

      nameYearsArray.forEach((year, yearIndex) => {
        let yearOldFormat = unformattedNameYears[yearIndex]
        let thereIsDataForThisYear = (el[yearOldFormat] !== '')
        let firstColumnIsUndefined = (el[dimFirstColumn()] === '')
        let rowIsUndefined = (el[dimRowRaw()] === '')
        let elementFirstColumn = firstColumnIsUndefined ?
            nameDimensions.nameDimFirstColumn + ' indéfini':
          el[dimFirstColumn()]
        let firstColumnHasNotBeenSeenAlready = (possibleFirstColumnValues.indexOf(elementFirstColumn) === -1)

        if (thereIsDataForThisYear) {
          allYearsData.push(
            {
              dimFirstColumn: elementFirstColumn,
              dimRow: rowIsUndefined ? nameDimensions.nameDimRowRaw + ' indéfini':el[dimRowRaw()],
              dimColumn: year, // dimColumn is here the year dimension
              dimElementInside: el[dimNameElements()],
              dimColorElements: el[dimColorElements()],
              dimYearData: el[yearOldFormat]
            })
        }

        if (firstColumnHasNotBeenSeenAlready && !wantedFirstColumnDefined) {
          possibleFirstColumnValues.push(elementFirstColumn)
        }
      })

      if (i === data.length - 1 && nameDimensions.nameDimFirstColumn) {
      }

      return allYearsData
    })

    /* Define here chart options that have to be define dynamically
         * ie. that require data contained in initial dataset */
    if (!wantedFirstColumnDefined) {
      wantedFirstColumn
        .title(dimFirstColumn()[0])
        .values(possibleFirstColumnValues)
        .defaultValue(possibleFirstColumnValues[0])

      possibleFirstColumnValues = []
      currentFirstColumnName = dimFirstColumn()[0]
    }

    return mapFunction
  })

  /* Definition of chart options */
  let chart = raw.chart()
  chart.model(model)
  chart.title('Road Map')
    .description('Simple Road Map')

  let displayFirstColumn = chart.checkbox()
    .title("Display First Column")
    .defaultValue(true)

  let rawWidth = chart.number()
    .title('Width')
    .defaultValue(1000)

  let rawHeight = chart.number()
    .title('Height')
    .defaultValue(900)

  let margin = chart.number()
    .title('Margin')
    .defaultValue(10)

  let colors  = chart.color()
    .title('Color scale')

  let wantedFirstColumn = chart.list()

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

  /* Function that converts a string containing an int and strings to the int
* Ex: 'Year 2020' would return 2020 */
  function getIntFromString (stringWithInt) {
    let arraySplit = stringWithInt.split(/([0-9]+)/)
    arraySplit = arraySplit.filter(el => !isNaN(parseInt(el)))

    return arraySplit[0]
  }

  /* Drawing function */
  chart.draw(function(selection, data) {
    // data is the data structure resulting from the application of the model

    let dataPerYear = data.reduce((dataElement1, dataElement2) => dataElement1.concat(...dataElement2))

    let dimFirstColumn = 'dimFirstColumn'
    let namesFirstColumnInstances = dataPerYear.map(el => el[dimFirstColumn]).filter((v, i, a) => a.indexOf(v) === i)
    let nameWantedFirstColumn = wantedFirstColumn()
    let isDisplayedFirstColumn = displayFirstColumn()

    console.log('dataChartPerYear', dataPerYear)
    let dimColumn = 'dimColumn'
    let dimRow = 'dimRow'
    let dimElementInside = 'dimElementInside'
    let dimColorElements = 'dimColorElements'
    let nameDimRowRaw = nameDimensions.nameDimRowRaw
    let dimYearData = 'dimYearData'
    let nameDimFirstColumn = nameDimensions.nameDimFirstColumn
    let nameDimColorElements = nameDimensions.nameDimColorElements
    let color1 = {red: 0, green: 153, blue: 51}
    let color2 = {red: 204, green: 0, blue: 204}

    // Filter the whole dataset to get only the elements of dataset which have the wanted first column
    dataPerYear = dataPerYear.filter(el => el[dimFirstColumn] === nameWantedFirstColumn)

    // Create color domain
    colors.domain(dataPerYear, el => el[dimColorElements])

    let margin = {top: 10, right: 0, bottom: 10, left: 0},
      graphWidth =  +rawWidth() - 25,
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
    let columnsName = nameDimensions.nameColumnsRaw
    let colNamesPlusEmpty = [nameDimRowRaw, ...columnsName]
    let rowsName = dataPerYear.map(el => el[dimRow]).filter((v, i, a) => a.indexOf(v) === i)
    let coefWidthFirstColumns = 0.75

    let cellWidth = (isDisplayedFirstColumn)
      ? graphWidth / (2 * coefWidthFirstColumns + columnsName.length)
      : graphWidth / (1 * coefWidthFirstColumns + columnsName.length)
    let firstColsCellsWidth = coefWidthFirstColumns * cellWidth
    // Because columnsName is only name of years
    divGridGraph.attr('transform', 'translate(' + cellWidth + ', 0)')

    /* Calculation of totals per row and per first column */
    let totalsPerRow = getTotalsPerRow ()
    let totalsPerColumn = getTotalsPerColumn()
    console.log('totals per row', totalsPerRow)
    console.log('totals per column', totalsPerColumn)

    // Create dataset of elements that are on multiple dimensions
    let ElementInsideNames = dataPerYear.map(el => el[dimElementInside]).filter((v, i, a) => a.indexOf(v) === i)

    // Separation of vertical, horizontal and single elements
    let separatedData = createMultiSingleData (dataPerYear, dimRow, dimColumn, dimElementInside, nameWantedFirstColumn)

    let horizontalElementsData = separatedData[0]
    let singleElementsData = separatedData[1]

    horizontalElementsData.push(...singleElementsData.map(el => {
      let yearsData = {}
      yearsData[el[dimColumn]] = el[dimYearData]
      return {nameInsideElement: el[dimElementInside],
        columnsName : [el[dimColumn]],
        rowName: el[dimRow],
        dimColorElements: (nameDimColorElements)?el[dimColorElements]:0.5,
        yearsData: yearsData}
    }))

    console.log('horiz', horizontalElementsData)
    console.log('single', singleElementsData)

    /* Calculation of element height */
    // Calculation of max horizontal elements in the same cell
    let maxHorizontalElementsPerRow = maxElementsInRow(horizontalElementsData, rowsName, columnsName)
    let maxElementsAllRows = maxHorizontalElementsPerRow.reduce((a, b) => {
      return a + b
    })
    console.log('maxHorizElements', maxHorizontalElementsPerRow)

    let marginBetweenRows = 4
    let marginBetweenElements = 2
    let strokeCorrection = 0.5
    let firstRowHeight = 30
    let numberMarginsBetweenElements = maxElementsAllRows - rowsName.length
    let elementHeight = (graphHeight - (firstRowHeight + (rowsName.length) * (marginBetweenRows + 2 * strokeCorrection) + numberMarginsBetweenElements * marginBetweenElements)) / maxElementsAllRows

    // Create position data for grid
    let gridData = createGridData(rowsName.length + 1, columnsName.length + 1, cellWidth, maxHorizontalElementsPerRow, elementHeight, firstRowHeight, firstColsCellsWidth)
    // Append names of row and columns in data
    gridData[0].forEach((col, indexCol) => col.titleColumn = colNamesPlusEmpty[indexCol]) // name columns
    for(let i=1; i<gridData.length; i++) { // name rows
      let currentRow = gridData[i]
      currentRow[0].titleRow = rowsName[i - 1]
      currentRow[0].total = totalsPerRow[i - 1]
    }

    for(let i=1; i<rowsName.length + 1; i++) {
      let currentRow = gridData[i]
      for (let j=0; j<columnsName.length; j++) {
        let currentCell = currentRow[j + 1]
        currentCell.rowName = rowsName[i - 1]
        currentCell.columnName = columnsName[j]
      }
    }

    console.log('gridData', gridData)

    /* Creation of the underneath grid */
    drawGrid (divGridGraph, gridData)
    if (isDisplayedFirstColumn) drawFirstColumn (divGridGraph, nameWantedFirstColumn, 1 + firstRowHeight, graphHeight, firstColsCellsWidth)

    /* Create superimposed svg elements */
    // Drawing of vertical elements and creating
    let gridSelection = d3.select('#grid')
    draw(horizontalElementsData, gridSelection, elementHeight)

    // function that creates a grid
    // http://www.cagrimmett.com/til/2016/08/17/d3-lets-make-a-grid.html
    function createGridData (numberRow, numberColumn, cellWidth, arrayMaxElementPerRow, elementHeight, firstRowHeight, firstColumnWidth) {
      let dataPos = [];
      let xpos = 1; //starting xpos and ypos at 1 so the stroke will show when we make the grid below
      let ypos = 1;
      let width = cellWidth
      let height

      // iterate for rows
      for (let row = 0; row < numberRow; row++) {
        dataPos.push( [] );
        let RowIsFirstRow = (row === 0)
        height = (row === 0)?firstRowHeight: arrayMaxElementPerRow[row - 1] * (elementHeight + marginBetweenElements) + 2 * strokeCorrection - marginBetweenElements

        // iterate for cells/columns inside rows
        for (let column = 0; column < numberColumn; column++) {
          let firstColumn = (column === 0)
          let widthCell = firstColumn ? firstColumnWidth : width

          dataPos[row].push({
            x: xpos,
            y: ypos,
            width: widthCell,
            height: height
          })
          // increment the x position. i.e. move it over by width (width variable)
          xpos += widthCell;
        }
        // reset the x position after a row is complete
        xpos = 1;
        // increment the y position for the next row. Move it down by height (height variable)
        ypos += height + marginBetweenRows;
      }
      return dataPos;
    }

    /* Function to draw the grid
    * selection is the d3 selection where the grid will be appended
    * gridData is the grid data with the position and dimension of each cell
    * See createGridData function*/
    function drawGrid (selection, gridData) {
      selection.append('g')
        .attr('id', 'grid')

      let grid = d3.select('#grid')
        .append('g')
        .attr("width", graphWidth + margin.left + margin.right + 'px')
        .attr("height", graphHeight + margin.bottom + margin.top + 'px')
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
            cellClass = 'columnNameRect'
            rowIndex = (i === columnsName.length)?(rowIndex + 1):rowIndex
          }
          return cellClass
        })
        .attr('id', rect =>{
          let rectIsAnInsideRect = (rect.rowName && rect.columnName)
          let idInsideRect = 'rect' + rowsName.indexOf(rect.rowName) + '' + columnsName.indexOf(rect.columnName)

          if (rectIsAnInsideRect) return idInsideRect
          else return;
        })
        .attr("x", function(rect) { return rect.x; })
        .attr("y", function(rect) { return rect.y; })
        .attr("width", function(rect) { return rect.width; })
        .attr("height", function(rect) { return rect.height; })

      // Adjust style of table
      d3.selectAll('.rowNameRect')
        .style('fill', '#49648c')
        .style('stroke', "#ffffff")

      d3.selectAll('.columnNameRect')
        .style('fill', (rect, indexRect) => {
          if (indexRect === 0) return '#ffffff'
          else return '#fff6de'
        })
        .style('stroke', "#49648c")

      d3.selectAll('.insideTableRect')
        .style('fill', 'transparent')
        .style('stroke', "#ffffff")

      d3.selectAll('.firstRect')
        .style('opacity', '0')
        .style('filter', 'alpha(opacity=0)')

      // Append name of rows and columns
      rowIndex = 0
      cell.append('text')
        .attr('x', cell => cell.x + cell.width/2)
        .attr('y', cell => {
          let cellIsRowTitle = cell.hasOwnProperty('titleRow')
          let cellIsColumnTitle = cell.hasOwnProperty('titleColumn')
          if (cellIsRowTitle) return cell.y + 2 * cell.height / 5
          else if (cellIsColumnTitle) return cell.y + cell.height / 2
        })
        .attr("dy", ".35em")
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .text(cell => {
          if (cell.hasOwnProperty('titleRow')) {
            return cell.titleRow
          }
          else if (cell.hasOwnProperty('titleColumn')) {
            return cell.titleColumn
          }
        })
        .style('fill', (cell, indexCell) => {
          let nameColor
          if (indexCell%(columnsName.length + 1) === 0) {
            // Cell is row name
            nameColor = '#ffffff'
          }

          if (rowIndex === 0) {
            // Cell is column name
            nameColor = '#49648c'
            rowIndex = (indexCell === columnsName.length  )?(rowIndex + 1):rowIndex
          }
          return nameColor
        })
        .style('font-family', 'Arial')
        .style('font-size', '11px')
        .call(wrap, cellWidth)

      // Draw lines that separate columns
      let separatingLine = grid.append('g')
        .attr('class', 'separatingLineG')
        .selectAll('separatingLine')
        .data(gridData[0])
        .enter()
        .append('path')
        .attr('d',(column, indexCell) => {
          let columnIsNamesColumn = (indexCell === 0 || indexCell === 1)
          if (!columnIsNamesColumn) {
            let topLineX = column.x // 0.7 is to make disappear white line between rect and arrow
            let topLineY = column.y + firstRowHeight
            let bottomLineX = topLineX
            let bottomArrowY = column.y + graphHeight
            return 'M' + topLineX + ' ' + topLineY //Upper point of line
              + ' L' + bottomLineX + ' ' + bottomArrowY // Bottom point of line
              + ' Z' // Close path
          }
        })
        .style('stroke', "#49648c")
        .style('stroke-dasharray', "0.2%, 0.3%")

      // Append totals
      d3.selectAll('.rowNameRect')
        .each(function (row, indexRow) {
          d3.select(this.parentNode)
          // append totals per row
          .append('text')
          .text(totalsPerRow[indexRow])
          .attr('x', cell => cell.x + cell.width/2)
          .attr('y', cell => cell.y + 2 * cell.height / 5 + 20)
          .attr("dy", ".35em")
          .attr('text-anchor', 'middle')
          .style('font-weight', 'bold')
          .style('font-family', 'Arial')
          .style('font-size', '11px')
            .style('fill', '#ffffff')
        })
    }

    /* Function that draws first column */
    function drawFirstColumn (parentSelection, nameFirstColumn, initialY, firstColumnHeight, firstColumnWidth) {
      // Translate the rest of the table of the equivalent of 1 cell width in x
      d3.select('#grid').attr('transform', 'translate(' + firstColumnWidth + ', 0)')

      let firstColumn = parentSelection.append('g')
        .attr('id', 'FirstColumn')

      firstColumn.append('rect')
        .attr('x', 1)
        .attr('y', 1)
        .attr('height', initialY - 1)
        .attr('width', firstColumnWidth)
        .attr('id', 'cellNameFirstColumn')
        .style('fill', '#ffffff')
        .style('stroke', '#49648c')

      firstColumn.append('text')
        .text(nameDimFirstColumn)
        .attr('x', 1 + firstColumnWidth / 2)
        .attr('y', 1 + initialY / 2)
        .attr('dy', '.3em')
        .attr('text-anchor', 'middle')
        .style('fill', '#49648c')
        .style('font-family', 'Arial')
        .style('font-size', '11px')
        .style('font-weight', 'bold')
        .call(wrap, cellWidth)

      firstColumn.append('rect')
        .attr('x', 1)
        .attr('y', initialY + marginBetweenRows)
        .attr('height', graphHeight - marginBetweenRows - firstRowHeight)
        .attr('width', firstColumnWidth)
        .attr('id', 'RectFirstColumn')
        .style('fill', '#374b69')
        .style('stroke', '#fff')

      let yNameColumn = initialY + marginBetweenRows + 2 * firstColumnHeight / 5

      // Append name first column
      firstColumn.append('text')
        .text(nameWantedFirstColumn)
        .attr('x', 1 + firstColumnWidth / 2)
        .attr('y', yNameColumn)
        .attr('dy', '.3em')
        .attr('text-anchor', 'middle')
        .style('fill', '#ffffff')
        .style('font-weight', 'bold')
        .style('font-family', 'Arial')
        .style('font-size', '11px')
        .call(wrap, cellWidth)

      // Append totals
      for (let year = 0; year < columnsName.length; year++) {
        firstColumn.append('text')
          .text(columnsName[year] + ' : ' + totalsPerColumn[year])
          .attr('x', 1 + 1/5 * firstColumnWidth)
          .attr('y', yNameColumn + 20 + 11 * year)
          .attr('dy', '.3em')
          .attr('text-anchor', 'right')
          .style('fill', '#ffffff')
          .style('font-weight', 'bold')
          .style('font-family', 'Arial')
          .style('font-size', '11px')
      }

      // Append big total
      firstColumn.append('text')
        .text('Total : ' + totalsPerColumn[columnsName.length])
        .attr('x', 1 + 1/5 * firstColumnWidth)
        .attr('y', yNameColumn + 3 * 20 + 11 * columnsName.length)
        .attr('dy', '.3em')
        .attr('text-anchor', 'right')
        .style('fill', '#ffffff')
        .style('font-weight', 'bold')
        .style('font-family', 'Arial')
        .style('font-size', '11px')
    }

    /* Calculate the maximum of elements that are in the same row
     * Returns [a, b, c] where a: max elements in a cell of first row
      * b: max elements in a cell of 2nd row ...*/
    function maxElementsInRow (horizontalElementsData, rowsName, columnsName) {
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

      return matrixHorizEl.map(row => Math.max(...row))
    }

    /* Returns an array of total budget ordered by row name, each total is a string */
    function getTotalsPerRow ()  {
      let totals = new Array(rowsName.length).fill().map(el => 0)
      let bigTotal = 0
          for (let indexElement = 0; indexElement < dataPerYear.length; indexElement++) {
            let rowOfElement = dataPerYear[indexElement].dimRow
            let indexOfRow = rowsName.indexOf(rowOfElement)
            let budgetElement = parseFloat(dataPerYear[indexElement].dimYearData) + 1000 ? parseFloat(dataPerYear[indexElement].dimYearData) : 0

        totals[indexOfRow] += budgetElement
        bigTotal += budgetElement
      }

      totals[totals.length] = bigTotal

      totals = totals.map(total => {
        if (total === 0) return 'A chiffrer'
        else return Number(Number(total).toFixed(2)).toLocaleString() + ' M€'
      })

      return totals
    }

    /* Returns an array of total budget ordered by column (usually year) name, each total is a string */
    function getTotalsPerColumn ()  {
      let totals = new Array(columnsName.length).fill().map(el => 0)
      let bigTotal = 0
          for (let indexElement = 0; indexElement < dataPerYear.length; indexElement++) {
            let columnOfElement = dataPerYear[indexElement].dimColumn
            let indexOfColumn = columnsName.indexOf(columnOfElement)
            let budgetElement = parseFloat(dataPerYear[indexElement].dimYearData) + 1000 ? parseFloat(dataPerYear[indexElement].dimYearData) : 0

        totals[indexOfColumn] += budgetElement
        bigTotal += budgetElement
      }

      totals[totals.length] = bigTotal

      totals = totals.map(total => {
        if (total === 0) return 'A chiffrer'
        else return Number(Number(total).toFixed(2)).toLocaleString() + ' M€'
      })

      return totals
    }

    /* Returns an array of elements data [dataVerticalElements, dataHorizontalElements, dataSingleElements]
    * dataElements : array of objects defining the position of elements
     * Ex : [{"AppName": "App1", "Branch": "Finance", "CompanyBrand": "Brand1" }]
     * with "Branch" being the column's name and "CompanyBrand" the row's one */
    function createMultiSingleData (dataElements, nameDimRow, nameDimColumn, nameDimElementInside, nameFirstColumn) {
      // Create array of elements that are in multiple cell or column
      let namesDataMultiple = dataElements.map(el => el[nameDimElementInside])
        .filter((v, i, a) => !(a.indexOf(v) === i))
        .filter((v, i, a) => a.indexOf(v) === i)

      let horizontalElementsData = []
      let singleElementsData = dataElements.filter(el => namesDataMultiple.indexOf(el[nameDimElementInside]) === -1)

      let colorElement = ''

      namesDataMultiple.forEach(nameInsideElement => {
        let rowsData = []
        let rows = []
        dataElements.filter(item => item[nameDimElementInside] === nameInsideElement)
          .forEach(el => {
            rows.push(el[nameDimRow])
            rowsData.push(el)
            colorElement = (nameDimColorElements)?el[dimColorElements]:0.5
          })

        let uniqueRowsName = rows.filter((v, i, a) => a.indexOf(v) === i)
          .sort((a, b) => {
            return rowsName.indexOf(a) - rowsName.indexOf(b)
          })

        uniqueRowsName.forEach(rowName => {
          let cols = []
          let yearsData = {}
          rowsData.filter(data => data[nameDimRow] === rowName)
            .forEach(el => {
              cols.push(el[nameDimColumn])
              yearsData[el[nameDimColumn]] =  el[dimYearData]
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
                    dimColorElements: colorElement,
                    yearsData: yearsData
                  })
                }
                else {
                  let dataElement = {}
                  dataElement[nameDimElementInside] = nameInsideElement
                  dataElement[nameDimColumn] = cs[0]
                  dataElement[nameDimRow] = rowName
                  dataElement[dimColorElements] = colorElement
                  dataElement[dimYearData] = yearsData[cs[0]]
                  singleElementsData.push(dataElement)
                }
                cs = [nameUniqueCols[l]]
                if (l === nameUniqueCols.length - 1) {
                  let dataElement = {}
                  dataElement[nameDimElementInside] = nameInsideElement
                  dataElement[nameDimColumn] = cs[0]
                  dataElement[nameDimRow] = rowName
                  dataElement[dimYearData] = yearsData[cs[0]]
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
                    dimColorElements: colorElement,
                    yearsData: yearsData
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
                  let dataElement = {}
                  dataElement[nameDimElementInside] = nameInsideElement
                  dataElement[nameDimColumn] = nameCol
                  dataElement[nameDimRow] = rs[0]
                  dataElement[dimYearData] = yearsData[nameCol]
                  dataElement[dimColorElements] = colorElement

                  // Check if element already in singleElementsData
                  let stringSingElData = singleElementsData.map(el => JSON.stringify(el))
                  if (stringSingElData.indexOf(JSON.stringify(dataElement)) === -1) {
                    singleElementsData.push(dataElement)
                  }
                  rs = [r[l]]
                  if (l === r.length - 1) {
                    let dataElement = {}
                    dataElement[nameDimElementInside] = nameInsideElement
                    dataElement[nameDimColumn] = nameCol
                    dataElement[nameDimRow] = rs[0]
                    dataElement[dimYearData] = yearsData[nameCol]
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
              dataElement[dimYearData] = yearsData[nameCol]
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

      return [horizontalElementsData, singleElementsData]
    }

    /* Create an array of objects, each one of them contains all the data necessary to define an element visually  */
    function createElementsPositionData (elementsData, elementHeight) {
      let dataElements = []
      let smallMove = 0

      elementsData.forEach(element => {

        // Select the cell where the element should have his first extremity
        let idCellBeginning = '#rect' + rowsName.indexOf(element.rowName)
          + '' + columnsName.indexOf(element.columnsName[0])

        let cellBeginningData =
          getSelectionCellData(idCellBeginning)
        let xBeginning = cellBeginningData.x
        let yBeginning = cellBeginningData.y

        // Select the cell where the element should have his end extremity
        let idCellEnd = '#rect' + rowsName.indexOf(element.rowName)
          + '' + columnsName.indexOf(element.columnsName[element.columnsName.length - 1])

        let cellEndData = getSelectionCellData(idCellEnd)
        let xEnd = cellEndData.x
        let yEnd = cellEndData.y
        let cellWidth = cellEndData.width
        let cellHeight = cellEndData.height

        let widthElement = xEnd - xBeginning + cellWidth - 20

        let heightElement = elementHeight

        dataElements.push({
          x: xBeginning + strokeCorrection,
          y: yBeginning + strokeCorrection,
          width: widthElement,
          height: heightElement,
          nameInsideElement: element.nameInsideElement,
          colorElement: (nameDimColorElements)?element[dimColorElements]:0.5,
          rowName: element.rowName,
          yearsData: element.yearsData
        })

        // smallMove is used so that no elements are exactly at the same position so that tick() works
        smallMove++
      })

      // Changes rectangles position so there is no overlapping and each element is on one row or one column
      moveToRightPlace(dataElements)

      return dataElements
    }

    /* Function to draw all elements on the graph
    * typeOfElement can be 'multi' for big rectangle elements or 'single' for unique cell elements
     * that will be drawn as circles */
    function draw(elementsData, gridSelection, elementHeight) {
      let dataElements = createElementsPositionData(elementsData, elementHeight)

      let elementsSpace = gridSelection.append('svg')
        .attr('class', 'superimposedElementsSpace')

      let dragRectangle = d3.drag()
        .on("start", dragstarted)
        .on("drag", rectangleDragged)
        .on("end", dragended)

      dataElements.forEach((dataElement, indexElement) => {
        dataElement.xBeginning = dataElement.x + 10
        dataElement.yBeginning = dataElement.y + 10

        let elementSelection = elementsSpace.selectAll('#elementNumber' + indexElement)
          .data([dataElement])
          .enter()
          .append('g')
          .attr('class', 'element')
          .attr('id', element => {
            return 'elementNumber' + indexElement
          })

        elementSelection.append('rect')
          .attr('x', element => element.x)
          .attr('y', element => element.y)
          .attr('width', element => element.width)
          .attr('height', element => element.height)
          .style('fill', element => nameDimColorElements ? colors()(element.colorElement) : '#d8dfeb')
          .attr('class', element => element.nameInsideElement)
          .style('stroke', 'transparent')
          .call(dragRectangle)

        elementSelection.append('path')
          .attr('d',element => {
            let topArrowX = element.x + element.width - 0.7 // 0.7 is to make disappear white line between rect and arrow
            let topArrowY = element.y
            let middleArrowX = element.x + element.width + 15
            let middleArrowY = element.y + element.height / 2
            let bottomArrowX = topArrowX
            let bottomArrowY = element.y + element.height
            return 'M' + topArrowX  + ' ' + topArrowY //Upper point of arrow
            + ' L' + middleArrowX + ' ' + middleArrowY // Front point of arrow
            + ' L' + bottomArrowX + ' ' + bottomArrowY // Bottom point
            + ' Z' // Close path
          })
          .style('fill', element => nameDimColorElements ? colors()(element.colorElement) : '#d8dfeb')

        elementSelection.append('text')
          .attr('dy', '.3em')
          .text(element => element.nameInsideElement)
          .attr('text-anchor', 'left')
          .attr('x', element => element.xBeginning)
          .attr('y', element => element.yBeginning)
          .style('fill', '#49648c')
          .style('font-family', 'Arial')
          .style('font-size', '10px')
          .attr('class', 'nameElement')
          .call(wrap)

        let yearsData = dataElement.yearsData

        let allAdditionalTexts = elementSelection.append('text')
          .attr('dy', '.3em')
          .attr('text-anchor', 'left')
          .attr('x', element => element.xBeginning + 0.6 * cellWidth)
          .attr('y', element => element.yBeginning + element.height - 20)
          .style('fill', '#49648c')
          .style('font-family', 'Arial')
          .style('font-size', '10px')

        Object.keys(yearsData).forEach((nameColumn, indexColumn) => {
          // nameColumn is usually year but could be '>2022' or 'Next 5 years' for example
          allAdditionalTexts.append('tspan')
            .attr('x', element => element.xBeginning + 0.6 * cellWidth)
            .attr('y', element => element.yBeginning + element.height - 20)
            .attr('dx', element => indexColumn * cellWidth)
            .text((parseInt(yearsData[nameColumn]) + 1000)?parseFloat(yearsData[nameColumn]).toLocaleString("latn") + ' M€':yearsData[nameColumn])
            .attr('class', 'additionalText')
        })
      })
    }

    function dragstarted(d) {
      d3.select(this.parentNode).raise().classed("active", true)
    }

    function rectangleDragged (d) {
      d3.select(this.parentNode).select('rect')
        .attr("x", d.x = d3.event.x)
        .attr("y", d.y = d3.event.y)

      d3.select(this.parentNode).selectAll('.nameElementText')
        .attr("x", d3.event.x + 10)
        .attr("y", d3.event.y + 10)

      d3.select(this.parentNode).selectAll('.additionalText')
        .attr("x", el => d3.event.x + 10 + 0.6 * cellWidth)
        .attr("y", el => d3.event.y + 10 + el.height - 20)

      d3.select(this.parentNode).select('path')
        .attr('d',element => {
          let topArrowX = d3.event.x + element.width
          let topArrowY = d3.event.y
          let middleArrowX = d3.event.x + element.width + 30
          let middleArrowY = d3.event.y + element.height / 2
          let bottomArrowX = d3.event.x + element.width
          let bottomArrowY = d3.event.y + element.height
          return 'M' + topArrowX + ' ' + topArrowY //Upper point of arrow
            + ' L' + middleArrowX + ' ' + middleArrowY // Front point of arrow
            + ' L' + bottomArrowX + ' ' + bottomArrowY // Bottom point
            + ' Z' // Close path
        })
    }

    function dragended(d) {
      d3.select(this.parentNode).classed("active", false)
    }

    /* Changes y position of all elements in elementsData to avoid overlapping */
    function moveToRightPlace (elementsData) {
      let elementsToPlaceInRow
      // For each row, look for elements
      rowsName.forEach(row => {
        elementsToPlaceInRow = elementsData.filter(el => el.rowName === row)
        let elementsToPlaceInCell
        // heightsAlreadyUsed is an array which indexes are the indexes of the years of the roadmap and which values are
        // arrays of already used heights for those years
        let heightsAlreadyUsed = new Array(columnsName.length).fill().map(() => [])

        // For each column in a row check for elements
        columnsName.forEach((column, indexCol) => {
          elementsToPlaceInCell = elementsToPlaceInRow.filter(el => Object.keys(el.yearsData).indexOf(column) !== -1)

          let element1
          for (let indexEl = 0; indexEl<elementsToPlaceInCell.length; indexEl++) {
            element1 = elementsToPlaceInCell[indexEl]

            // while height is already used
            while (heightsAlreadyUsed[indexCol].indexOf(element1.y) !== -1) {
              element1.y += elementHeight + marginBetweenElements
            }

            for (let i=indexCol; i<indexCol + Object.keys(element1.yearsData).length; i++) {
              // set the heights in each cell where element1 is as used heights
              heightsAlreadyUsed[i].push(element1.y)
            }

            elementsToPlaceInRow.splice(elementsToPlaceInRow.indexOf(element1), 1) // Element has been placed
          }
        })
      })
    }

    /* Function that returns the selection cell bounded data (contains x, y, width, height) */
    function getSelectionCellData (idCell) {
      return d3.selectAll('.Row').selectAll('.Cell').select(idCell).datum()
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

    function wrap(text, width) {
      text.each(function() {
        let parentNode = d3.select(this.parentNode).select('rect')
        let text = d3.select(this),
          maxWidth = width ? width : parentNode.attr('width') - 3,
          words = text.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = 0,
          lineHeight = 1.1, // ems
          y = text.attr("y"),
          x = text.attr('x'),
          dy = parseFloat(text.attr("dy")),
          tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em")
            .attr('class', 'nameElementText')
        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > parentNode.attr('width') - 3) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word)
              .attr('class', 'nameElementText')
          }
        }
      });
    }
  })
})();