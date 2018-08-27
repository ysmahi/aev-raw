(function () {
  /* Creation of model */
  let model = raw.model()

  let dimColumnRaw = model.dimension()
    .title('Name Columns')
    .types(String)

  let dimRowRaw = model.dimension()
    .title('Name Rows')
    .types(String)

  let dimNameElements = model.dimension()
    .title('Name of Elements')
    .types(String)

  let dimColorElements = model.dimension()
    .title('Color of Elements')
    .types(String, Number)

  /* Map function */
  model.map(data => {
    return data.map((el, i) => {
      if (i === 0) {
        nameDimensions = {
          nameDimNameElements: dimNameElements()[0],
          nameColumnRaw: dimColumnRaw()[0],
          nameDimRowRaw: dimRowRaw()[0],
          nameDimColorElements: (dimColorElements())?dimColorElements()[0]:false
        }
      }

      return {
        dimColumn: el[dimColumnRaw()],
        dimRow: el[dimRowRaw()],
        dimElementInside: el[dimNameElements()],
        dimColorElements: el[dimColorElements()]
      }
    })
  })

  /* Definition of chart options */
  let chart = raw.chart()
  chart.model(model)
  chart.title('New Double Entry Table')
    .description('Double table entry table to display elements that are in one cell or on multiple cells at once')

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
    let dimColorElements = 'dimColorElements'
    let nameColumnRaw = nameDimensions.nameColumnRaw
    let nameDimRowRaw = nameDimensions.nameDimRowRaw
    let nameDimColorElements = nameDimensions.nameDimColorElements
    let color1 = {red: 0, green: 153, blue: 51}
    let color2 = {red: 204, green: 0, blue: 204}

    // Create color domain
    colors.domain(data, el => el[dimColorElements])

    let margin = {top: 30, right: 0, bottom: 20, left: 0},
    graphWidth =  +rawWidth() - 25,
    graphHeight = +rawHeight() - margin.top - margin.bottom

    selection
      .attr("width", graphWidth + margin.left + margin.right + 'px')
      .attr("height", graphHeight + margin.bottom + margin.top + 'px')
      .style("margin-left", -margin.left + "px")
      .style("margin.right", -margin.right + "px")

    let divGridGraph = selection.append('svg')
      .attr('class', 'gridGraph')

    /* Retrieve data from dataset */
    // Create columns' and rows' name arrays
    let columnsName = data.map(el => el[dimColumn]).filter((v, i, a) => a.indexOf(v) === i)
    let colNamesPlusEmpty = data.map(el => el[dimColumn]).filter((v, i, a) => a.indexOf(v) === i)
    colNamesPlusEmpty.unshift('')
    let rowsName = data.map(el => el[dimRow]).filter((v, i, a) => a.indexOf(v) === i)

    // Create dataset of elements that are on multiple dimensions
    let ElementInsideNames = data.map(el => el[dimElementInside]).filter((v, i, a) => a.indexOf(v) === i)

    // Separation of vertical, horizontal and single elements
    let separatedData = createMultiSingleData (data, dimRow, dimColumn, dimElementInside)

    let verticalElementsData = separatedData[0]
    let horizontalElementsData = separatedData[1]
    let singleElementsData = separatedData[2]

    console.log('horiz', horizontalElementsData)
    console.log('vert', verticalElementsData)
    console.log('single', singleElementsData)

    // Create position data for grid
    let gridData = createGridData(rowsName.length + 1, columnsName.length + 1, graphWidth / (columnsName.length + 1), graphHeight / (rowsName.length + 1))
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
      }
    }

    console.log('gridData', gridData)

    /* Creation of the underneath grid */
    divGridGraph.append('g')
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
          cellClass = (i === 0)?'firstRect':'columnNameRect'
          rowIndex = (i === columnsName.length  )?(rowIndex + 1):rowIndex
        }

        return cellClass
      })
      .attr('id', rect =>{
        let rectIsAnInsideRect = (rect.rowName && rect.columnName)

        if (rectIsAnInsideRect) return '' + rect.rowName + rect.columnName
        else return;
      })
      .attr("x", function(d) { return d.x; })
      .attr("y", function(d) { return d.y; })
      .attr("width", function(d) { return d.width; })
      .attr("height", function(d) { return d.height; })

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
    let maxHorizontalElements = getMaxHorizontalElements (horizontalElementsData, rowsName, columnsName)
    let maxVerticalElements = getMaxVerticalElements (verticalElementsData, rowsName, columnsName)
    let maxElementInCell = maxVerticalElements * maxHorizontalElements

    console.log('maxHorizElements', maxHorizontalElements)
    console.log('maxVertElements', maxVerticalElements)

    // Drawing of vertical elements and creating
    draw(verticalElementsData, 'multi')
    draw(horizontalElementsData, 'multi')
    draw(singleElementsData, 'single')

    // function that creates a grid
// http://www.cagrimmett.com/til/2016/08/17/d3-lets-make-a-grid.html
    function createGridData (numberRow, numberColumn, cellWidth, cellHeight) {
      let dataPos = [];
      let xpos = 1; //starting xpos and ypos at 1 so the stroke will show when we make the grid below
      let ypos = 1;
      let width = cellWidth;
      let height = cellHeight;

      // iterate for rows
      for (let row = 0; row < numberRow; row++) {
        dataPos.push( [] );

        // iterate for cells/columns inside rows
        for (let column = 0; column < numberColumn; column++) {
          dataPos[row].push({
            x: xpos,
            y: ypos,
            width: width,
            height: height
          })
          // increment the x position. i.e. move it over by width (width variable)
          xpos += width;
        }
        // reset the x position after a row is complete
        xpos = 1;
        // increment the y position for the next row. Move it down by height (height variable)
        ypos += height;
      }
      return dataPos;
    }

    /* Calculate cell height depending on the maximum number of horizontal elements in a cell */
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

    /* Calculate cell width depending on the maximum number of vertical elements in a cell */
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
     * Ex : [{"AppName": "App1", "Branch": "Finance", "CompanyBrand": "Brand1" }]
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
        dataElements.filter(item => item[nameDimElementInside] === nameInsideElement)
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
    function createElementsPositionData (elementsData) {
      let dataElements = []
      let smallMove = 0
      let elementIsSingle

      elementsData.forEach(element => {
        let elementIsVertical = (element.hasOwnProperty('rowsName'))
        elementIsSingle = (!element.hasOwnProperty('rowsName') && !element.hasOwnProperty('columnsName'))

        // Select the cell where the element should have his first extremity
        let idCellBeginning = (elementIsSingle)?'#' + element[dimRow] + element[dimColumn]:
          (elementIsVertical)?
            '#' + element.rowsName[0] + element.columnName:
            '#' + element.rowName + element.columnsName[0]

        let cellBeginningData = getSelectionCellData(idCellBeginning)
        let xBeginning = cellBeginningData.x
        let yBeginning = cellBeginningData.y

        // Select the cell where the element should have his end extremity
        let idCellEnd = (elementIsSingle)?'#' + element[dimRow] + element[dimColumn]:
          (elementIsVertical)?
            '#' + element.rowsName[element.rowsName.length - 1] + element.columnName:
            '#' + element.rowName + element.columnsName[element.columnsName.length - 1]

        let cellEndData = getSelectionCellData(idCellEnd)
        let xEnd = cellEndData.x
        let yEnd = cellEndData.y
        let cellWidth = cellEndData.width
        let cellHeight = cellEndData.height

        let radiusElement = (elementIsSingle)?22:0

        let xCellCenter = xBeginning + cellWidth / 2
        let yCellCenter = yBeginning + cellHeight / 2

        let widthElement = (elementIsVertical)?
          cellWidth / 3 - 10:
          xEnd - xBeginning + cellWidth - 20

        let heightElement = (elementIsVertical)?
          yEnd - yBeginning + cellHeight - 20:
          cellHeight / 3 - 10

        dataElements.push({
          idealX: (elementIsSingle)?xCellCenter:(elementIsVertical)?xBeginning + widthElement + 15:xBeginning + 10,
          idealY: (elementIsSingle)?yCellCenter:(elementIsVertical)?yBeginning + 10:yBeginning + heightElement + 15,
          x: (elementIsVertical)?xBeginning + smallMove:xBeginning,
          y: (elementIsVertical)?yBeginning:yBeginning + smallMove,
          size: [widthElement, heightElement],
          radius: radiusElement,
          nameInsideElement: (elementIsSingle)?element[dimElementInside]:element.nameInsideElement,
          colorElement: (nameDimColorElements)?element[dimColorElements]:0.5
        })

        // smallMove is used so that no elements are exactly at the same position so that tick() works
        smallMove++
      })

      // Changes rectangles position so there is no overlapping and each element is on one row or one column
      let formOfElement = (elementIsSingle)?'circles':'rectangles'
      moveToRightPlace(dataElements, formOfElement)

      return dataElements
    }

    /* Function to draw all elements on the graph
    * typeOfElement can be 'multi' for big rectangle elements or 'single' for unique cell elements
     * that will be drawn as circles */
    function draw(elementsData, typeOfElement) {
      let dataElements = createElementsPositionData(elementsData)
      let bigElements = (typeOfElement === 'multi')

      let elementsSpace = grid.append('svg')
        .attr('class', 'superimposedElementsSpace')

      let dragCircle = d3.drag()
        .on("start", dragstarted)
        .on("drag", circleDragged)
        .on("end", dragended)

      let dragRectangle = d3.drag()
        .on("start", dragstarted)
        .on("drag", rectangleDragged)
        .on("end", dragended)

      dataElements.forEach(dataElement => {
        dataElement.xCenter = dataElement.x + dataElement.size[0] / 2
        dataElement.yCenter = dataElement.y + dataElement.size[1] / 2

        let elementSelection = elementsSpace.selectAll('#' + dataElement.nameInsideElement)
          .data([dataElement])
          .enter()
          .append('g')
          .attr('class', 'element')
          .attr('id', element => element.nameInsideElement)

        elementSelection.append((bigElements)?'rect':'circle')
          .attr((bigElements)?'x':'cx', element => element.x)
          .attr((bigElements)?'y':'cy', element => element.y)
          .style('fill', element => colors() ? colors()(element.colorElement) : "grey")
          .attr('class', element => element.nameInsideElement)
          .style('stroke', 'black')
          .call((bigElements)?dragRectangle:dragCircle)

        elementSelection.append('text')
          .attr('dy', '.3em')
          .text(element => element.nameInsideElement)
          .attr('text-anchor', 'middle')

        if (bigElements) {
          elementSelection.select('rect')
            .attr('width', element => element.size[0])
            .attr('height', element => element.size[1])

          elementSelection.select('text')
            .attr('x', element => element.xCenter)
            .attr('y', element => element.yCenter)
        }

        else {
          elementSelection.select('circle')
            .attr('r', element => element.radius)

          elementSelection.select('text')
            .attr('x', element => element.x )
            .attr('y', element => element.y )
        }
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
    function moveToRightPlace (elementsData, formOfElement) {
      let elementsAreCircles = (formOfElement === 'circles')
      let elementsAreRectangles = (formOfElement === 'rectangles')

      let collisionForce
      if (elementsAreRectangles) collisionForce = rectCollide().size(rectangle => [rectangle.size[0], rectangle.size[1]])
      if (elementsAreCircles) collisionForce = d3.forceCollide().radius(circle => circle.radius)

      let simulation = d3.forceSimulation(elementsData)
        .force("x", d3.forceX(function(element) { return element.idealX }))
        .force("y", d3.forceY(function(element) { return element.idealY }))
        .force("collision", collisionForce)
        .stop()

      for (let i = 0; i < 200 ; ++i) simulation.tick()
    }

    function rectCollide() {
      let nodes, sizes, masses
      let size = constant([0, 0])
      let strength = 1
      let iterations = 1

      function force() {
        let node, size, mass, xi, yi
        let i = -1
        while (++i < iterations) { iterate() }

        function iterate() {
          let j = -1
          let tree = d3.quadtree(nodes, xCenter, yCenter).visitAfter(prepare)

          while (++j < nodes.length) {
            node = nodes[j]
            size = sizes[j]
            mass = masses[j]
            xi = xCenter(node)
            yi = yCenter(node)

            tree.visit(apply)
          }
        }

        function apply(quad, x0, y0, x1, y1) {
          let data = quad.data
          let xSize = (size[0] + quad.size[0]) / 2
          let ySize = (size[1] + quad.size[1]) / 2
          if (data) {
            if (data.index <= node.index) { return }

            let x = xi - xCenter(data)
            let y = yi - yCenter(data)
            let xd = Math.abs(x) - xSize
            let yd = Math.abs(y) - ySize

            if (xd < 0 && yd < 0) {
              let l = Math.sqrt(x * x + y * y)
              let m = masses[data.index] / (mass + masses[data.index])

              if (Math.abs(xd) < Math.abs(yd)) {
                node.vx -= (x *= xd / l * strength) * m
                data.vx += x * (1 - m)
              } else {
                node.vy -= (y *= yd / l * strength) * m
                data.vy += y * (1 - m)
              }
            }
          }

          return x0 > xi + xSize || y0 > yi + ySize ||
            x1 < xi - xSize || y1 < yi - ySize
        }

        function prepare(quad) {
          if (quad.data) {
            quad.size = sizes[quad.data.index]
          } else {
            quad.size = [0, 0]
            let i = -1
            while (++i < 4) {
              if (quad[i] && quad[i].size) {
                quad.size[0] = Math.max(quad.size[0], quad[i].size[0])
                quad.size[1] = Math.max(quad.size[1], quad[i].size[1])
              }
            }
          }
        }
      }

      function xCenter(d) { return d.x + d.vx + sizes[d.index][0] / 2 }
      function yCenter(d) { return d.y + d.vy + sizes[d.index][1] / 2 }

      force.initialize = function (_) {
        sizes = (nodes = _).map(size)
        masses = sizes.map(function (d) { return d[0] * d[1] })
      }

      force.size = function (_) {
        return (arguments.length
          ? (size = typeof _ === 'function' ? _ : constant(_), force)
          : size)
      }

      force.strength = function (_) {
        return (arguments.length ? (strength = +_, force) : strength)
      }

      force.iterations = function (_) {
        return (arguments.length ? (iterations = +_, force) : iterations)
      }

      return force
    }

    function boundedBox() {
      let nodes, sizes
      let bounds
      let size = constant([0, 0])

      function force() {
        let node, size
        let xi, x0, x1, yi, y0, y1
        let i = -1
        while (++i < nodes.length) {
          node = nodes[i]
          size = sizes[i]
          xi = node.x + node.vx
          x0 = bounds[0][0] - xi
          x1 = bounds[1][0] - (xi + size[0])
          yi = node.y + node.vy
          y0 = bounds[0][1] - yi
          y1 = bounds[1][1] - (yi + size[1])
          if (x0 > 0 || x1 < 0) {
            node.x += node.vx
            node.vx = -node.vx
            if (node.vx < x0) { node.x += x0 - node.vx }
            if (node.vx > x1) { node.x += x1 - node.vx }
          }
          if (y0 > 0 || y1 < 0) {
            node.y += node.vy
            node.vy = -node.vy
            if (node.vy < y0) { node.vy += y0 - node.vy }
            if (node.vy > y1) { node.vy += y1 - node.vy }
          }
        }
      }

      force.initialize = function (_) {
        sizes = (nodes = _).map(size)
      }

      force.bounds = function (_) {
        return (arguments.length ? (bounds = _, force) : bounds)
      }

      force.size = function (_) {
        return (arguments.length
          ? (size = typeof _ === 'function' ? _ : constant(_), force)
          : size)
      }

      return force
    }

    function constant(_) {
      return function () { return _ }
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
  })
})();