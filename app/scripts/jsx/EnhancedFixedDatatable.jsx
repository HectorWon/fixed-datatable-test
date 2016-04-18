'use strict';

// Data button component
var FileGrabber = React.createClass({
  // Saves table content to a text file
  saveFile: function() {
    var formatData = this.state.formatData || this.props.content();
    this.state.formatData = formatData;

    var blob = new Blob([formatData], {type: 'text/plain'});
    var fileName = this.props.downloadFileName ? this.props.downloadFileName : "data.txt";

    var downloadLink = document.createElement("a");
    downloadLink.download = fileName;
    downloadLink.innerHTML = "Download File";
    if (window.webkitURL) {
      // Chrome allows the link to be clicked
      // without actually adding it to the DOM.
      downloadLink.href = window.webkitURL.createObjectURL(blob);
    }
    else {
      // Firefox requires the link to be added to the DOM
      // before it can be clicked.
      downloadLink.href = window.URL.createObjectURL(blob);
      downloadLink.onclick = function(event) {
        document.body.removeChild(event.target);
      };
      downloadLink.style.display = "none";
      document.body.appendChild(downloadLink);
    }

    downloadLink.click();
  },

  getInitialState: function() {
    return {
      formatData: ''
    };
  },

  render: function() {
    return (
      <button className="btn btn-default" onClick={this.saveFile}>DATA</button>
    );
  }
});

// Copy button component
var ClipboardGrabber = React.createClass({
  click: function() {
    if (!this.state.formatData) {
      var client = new ZeroClipboard($("#copy-button")), content = this.props.content();
      this.state.formatData = content;
      client.on("ready", function(readyEvent) {
        client.on("copy", function(event) {
          event.clipboardData.setData('text/plain', content);
        });
      });
    }
    this.notify();
  },

  notify: function() {
    $.notify({
      message: 'Copied.'
    }, {
      type: 'success',
      animate: {
        enter: 'animated fadeInDown',
        exit: 'animated fadeOutUp'
      },
      delay: 1000
    });
  },

  getInitialState: function() {
    return {
      formatData: ''
    };
  },

  render: function() {
    return (
      <button className="btn btn-default" id="copy-button" onClick={this.click}>
        COPY</button>
    );
  }
});

// Container of FileGrabber and ClipboardGrabber
var DataGrabber = React.createClass({
  // Prepares table content data for download or copy button
  prepareContent: function() {
    var content = [], cols = this.props.cols, rows = this.props.rows;

    _.each(cols, function(e) {
      content.push((e.displayName || 'Unknown'), '\t');
    });
    content.pop();

    _.each(rows, function(row) {
      content.push('\r\n');
      _.each(cols, function(col) {
        content.push(row[col.name], '\t');
      });
      content.pop();
    });
    return content.join('');
  },

  render: function() {
    var getData = this.props.getData;
    if (getData === "NONE") {
      return <div></div>;
    }

    var content = this.prepareContent;

    return (
      <div>
        <div className="EFDT-download-btn EFDT-top-btn">
          {
            getData != "COPY" ? <FileGrabber content={content}
                                             downloadFileName={this.props.downloadFileName}/> :
              <div></div>
          }
        </div>
        <div className="EFDT-download-btn EFDT-top-btn">
          {
            getData != "DOWNLOAD" ? <ClipboardGrabber content={content}/> :
              <div></div>
          }
        </div>
      </div>
    );
  }
});

// Wrapper of qTip for string
// Generates qTip when string length is larger than 20
var QtipWrapper = React.createClass({
  render: function() {
    var label = this.props.label, qtipFlag = false;
    var shortLabel = this.props.shortLabel;

    if (label && shortLabel && label.toString().length > shortLabel.toString().length) {
      qtipFlag = true;
    }
    return (
      <span className={qtipFlag?"hasQtip":""} data-qtip={label}>
        {shortLabel}
      </span>
    );
  }
});

// Column show/hide component
var ColumnHider = React.createClass({
  tableCols: [],// For the checklist

  // Updates column show/hide settings
  hideColumns: function(list) {
    var cols = this.props.cols, filters = this.props.filters;
    for (var i = 0; i < list.length; i++) {
      cols[i].show = list[i].isChecked;
      if (this.props.hideFilter) {
        filters[cols[i].name].hide = !cols[i].show;
      }
    }
    this.props.updateCols(cols, filters);
  },

  // Prepares tableCols
  componentWillMount: function() {
    var cols = this.props.cols;
    var colsL = cols.length;
    for (var i = 0; i < colsL; i++) {
      this.tableCols.push({
        id: cols[i].name,
        label: cols[i].displayName,
        isChecked: true
      });
    }
  },

  componentDidMount: function() {
    var hideColumns = this.hideColumns;

    // Dropdown checklist
    $('#hide_column_checklist')
      .dropdownCheckbox({
        data: this.tableCols,
        autosearch: true,
        title: "Show / Hide Columns",
        hideHeader: false,
        showNbSelected: true
      })
      // Handles dropdown checklist event
      .on("change", function() {
        var list = ($("#hide_column_checklist").dropdownCheckbox("items"));
        hideColumns(list);
      });
  },

  render: function() {
    return (
      <div id="hide_column_checklist" className="EFDT-top-btn"></div>
    );
  }
});

// Choose fixed columns component
var PinColumns = React.createClass({
  tableCols: [],// For the checklist

  // Updates fixed column settings
  pinColumns: function(list) {
    var cols = this.props.cols;
    for (var i = 0; i < list.length; i++) {
      cols[i].fixed = list[i].isChecked;
    }
    this.props.updateCols(cols, this.props.filters);
  },

  // Prepares tableCols
  componentWillMount: function() {
    var cols = this.props.cols;
    var colsL = cols.length;
    for (var i = 0; i < colsL; i++) {
      this.tableCols.push({
        id: cols[i].name,
        label: cols[i].displayName,
        isChecked: cols[i].fixed
      });
    }
  },

  componentDidMount: function() {
    var pinColumns = this.pinColumns;

    // Dropdown checklist
    $("#pin_column_checklist")
      .dropdownCheckbox({
        data: this.tableCols,
        autosearch: true,
        title: "Choose Fixed Columns",
        hideHeader: false,
        showNbSelected: true
      })
      // Handles dropdown checklist event
      .on("change", function() {
        var list = ($("#pin_column_checklist").dropdownCheckbox("items"));
        pinColumns(list);
      });
  },

  render: function() {
    return (
      <div id="pin_column_checklist" className="EFDT-top-btn"></div>
    );
  }
});

// Column scroller component
var ColumnScroller = React.createClass({
  // Scrolls to user selected column
  scrollToColumn: function(e) {
    var name = e.target.value, cols = this.props.cols, index, colsL = cols.length;
    for (var i = 0; i < colsL; i++) {
      if (name === cols[i].name) {
        index = i;
        break;
      }
    }
    this.props.updateGoToColumn(index);
  },

  render: function() {
    return (
      <Chosen data-placeholder="Column Scroller" onChange={this.scrollToColumn}>
        {
          this.props.cols.map(function(col) {
            return (
              <option title={col.displayName} value={col.name}>
                <QtipWrapper label={col.displayName}/>
              </option>
            );
          })
        }
      </Chosen>
    );
  }
});

// Filter component
var Filter = React.createClass({
  getInitialState: function() {
    return {key: ''};
  },
  handleChange: function(event) {
    this.setState({key: event.target.value});
    this.props.onFilterKeywordChange(event);
  },
  componentWillUpdate: function() {
    if (this.props.type === 'STRING') {
      if (!_.isUndefined(this.props.filter) && this.props.filter.key !== this.state.key && this.props.filter.key === '' && this.props.filter.reset) {
        this.state.key = '';
        this.props.filter.reset = false;
      }
    }
  },
  render: function() {
    switch (this.props.type) {
      case "NUMBER":
        return (
          <div className="EFDT-header-filters">
            <span id={"range-"+this.props.name}></span>

            <div className="rangeSlider" data-max={this.props.max}
                 data-min={this.props.min} data-column={this.props.name}></div>
          </div>
        );
      case "STRING":
        return (
          <div className="EFDT-header-filters">
            <input className="form-control"
                   placeholder={this.props.hasOwnProperty('placeholder')?this.props.placeholder:"Input a keyword"}
                   data-column={this.props.name}
                   value={this.state.key}
                   onChange={this.handleChange}/>
          </div>
        );
    }
  }
});

// Table prefix component
// Contains components above the main part of table
var TablePrefix = React.createClass({
  render: function() {
    return (
      <div>
        <div>
          {
            this.props.hider ?
              <div className="EFDT-show-hide">
                <ColumnHider cols={this.props.cols} filters={this.props.filters}
                             hideFilter={this.props.hideFilter}
                             updateCols={this.props.updateCols}/>
              </div> :
              ""
          }
          {
            this.props.fixedChoose ?
              <div className="EFDT-fixed-choose">
                <PinColumns cols={this.props.cols} filters={this.props.filters}
                            updateCols={this.props.updateCols}/>
              </div> :
              ""
          }
          <div className="EFDT-download">
            <DataGrabber cols={this.props.cols} rows={this.props.rows}
                         downloadFileName={this.props.downloadFileName}
                         getData={this.props.getData}/>
          </div>
          {
            this.props.resultInfo ?
              <div className="EFDT-result-info">
                <span className="EFDT-result-info-content">
                  Showing {this.props.filteredRowsSize} samples
                  {
                    this.props.filteredRowsSize !== this.props.rowsSize ?
                      <span>{' (filtered from ' + this.props.rowsSize + ') '}
                        <span className="EFDT-header-filters-reset"
                              onClick={this.props.onResetFilters}>Reset</span>
                      </span>
                      : ''
                  }
                </span>
              </div> :
              ""
          }
        </div>
        <div>
          <div className="EFDT-filter">
            {
              (this.props.filter === "ALL" || this.props.filter === "GLOBAL") ?
                <Filter type="STRING" name="all"
                        onFilterKeywordChange={this.props.onFilterKeywordChange}/> :
                <div></div>
            }
          </div>
        </div>
      </div>
    );
  }
});

// Wrapper for the header rendering
var HeaderWrapper = React.createClass({
  render: function() {
    var columnData = this.props.columnData;
    var shortLabel = this.props.shortLabel;
    return (
      <div className="EFDT-header">
        <a href="#"
           onClick={this.props.sortNSet.bind(null, this.props.cellDataKey)}>
          <QtipWrapper label={columnData.displayName}
                       shortLabel={shortLabel}/>
          {columnData.sortFlag ?
            <div className={columnData.sortDirArrow}></div>
            : ""}
        </a>
      </div>
    );
  }
});

var CustomizeCell = React.createClass({
  render: function() {
    var Cell = FixedDataTable.Cell;
    var rowIndex = this.props.rowIndex, data = this.props.data, field = this.props.field, filterAll = this.props.filterAll;
    var flag = (data[rowIndex][field] && filterAll.length > 0) ?
      (data[rowIndex][field].toLowerCase().indexOf(filterAll.toLowerCase()) >= 0) : false;
    var shortLabels = this.props.shortLabels;
    return (
      <Cell columnKey={field}>
        <span style={flag ? {backgroundColor:'yellow'} : {}}>
            <QtipWrapper label={data[rowIndex].row[field]}
                         shortLabel={shortLabels[data[rowIndex].index][field]}/>
        </span>
      </Cell>
    );
  }
});

// Main part table component
// Uses FixedDataTable library
var TableMainPart = React.createClass({
  // Creates Qtip
  createQtip: function() {
    $('.EFDT-table .hasQtip').one('mouseenter', function() {
      $(this).qtip({
        content: {text: $(this).attr('data-qtip')},
        hide: {fixed: true, delay: 100},
        show: {ready: true},
        style: {classes: 'qtip-light qtip-rounded qtip-shadow', tip: true},
        position: {my: 'center left', at: 'center right', viewport: $(window)}
      });
    });
  },

  // Creates Qtip after first rendering
  componentDidMount: function() {
    this.createQtip();
  },

  // Creates Qtip after update rendering
  componentDidUpdate: function() {
    this.createQtip();
  },

  // Creates Qtip after page scrolling
  onScrollEnd: function() {
    this.createQtip();
  },

  // Destroys Qtip before update rendering
  componentWillUpdate: function() {
    //console.log('number of elments which has "hasQtip" as class name: ', $('.hasQtip').size());
    //console.log('number of elments which has "hasQtip" as class name under class EFDT: ', $('.EFDT-table .hasQtip').size());

    $('.EFDT-table .hasQtip')
      .each(function() {
        $(this).qtip('destroy', true);
      });
  },

  // FixedDataTable render function
  render: function() {
    var Table = FixedDataTable.Table, Column = FixedDataTable.Column,
      ColumnGroup = FixedDataTable.ColumnGroup, props = this.props,
      rows = this.props.filteredRows, columnWidths = this.props.columnWidths,
      cellShortLabels = this.props.shortLabels.cell,
      headerShortLabels = this.props.shortLabels.header;

    return (
      <div>
        <Table
          rowHeight={props.rowHeight?props.rowHeight:30}
          rowGetter={this.rowGetter}
          onScrollEnd={this.onScrollEnd}
          rowsCount={props.filteredRows.length}
          width={props.tableWidth?props.tableWidth:1230}
          maxHeight={props.maxHeight?props.maxHeight:500}
          headerHeight={props.headerHeight?props.headerHeight:30}
          groupHeaderHeight={props.groupHeaderHeight?props.groupHeaderHeight:50}
          scrollToColumn={props.goToColumn}
        >
          {
            props.cols.map(function(col) {
              var column;
              var width = col.show ? (col.width ? col.width :
                (columnWidths[col.name] ? columnWidths[col.name] : 200)) : 0;

              if (props.groupHeader) {
                column = <ColumnGroup
                  header={
                      <Filter type={props.filters[col.name].type} name={col.name}
                      max={col.max} min={col.min} filter={props.filters[col.name]}
                      placeholder="Filter column"
                      onFilterKeywordChange={props.onFilterKeywordChange}
                      />
                  }
                  key={col.name}
                  fixed={col.fixed}
                  align="center"
                >
                  <Column
                    header={
                      <HeaderWrapper cellDataKey={col.name} columnData={{displayName:col.displayName,sortFlag:props.sortBy === col.name,
                        sortDirArrow:props.sortDirArrow,filterAll:props.filterAll,type:props.filters[col.name].type}}
                        sortNSet={props.sortNSet} filter={props.filters[col.name]}
                        shortLabel={headerShortLabels[col.name]}
                      />
                    }
                    cell={<CustomizeCell data={rows}  field={col.name}
                    filterAll={props.filterAll} shortLabels={cellShortLabels}
                    />}
                    width={width}
                    fixed={col.fixed}
                    allowCellsRecycling={true}
                  />
                </ColumnGroup>
              } else {
                column = <Column
                  header={
                      <HeaderWrapper cellDataKey={col.name} columnData={{displayName:col.displayName,sortFlag:props.sortBy === col.name,
                        sortDirArrow:props.sortDirArrow,filterAll:props.filterAll,type:props.filters[col.name].type}}
                        sortNSet={props.sortNSet} filter={props.filters[col.name]}
                      />
                    }
                  cell={<CustomizeCell data={rows}  field={col.name}
                  filterAll={props.filterAll}
                  shortLabels={cellShortLabels}
                  />}
                  width={width}
                  fixed={col.fixed}
                  allowCellsRecycling={true}
                  key={col.name}
                />
              }
              return (
                column
              );
            })
          }
        </Table>
      </div>
    );
  }
});

// Root component
var EnhancedFixedDataTable = React.createClass({
  SortTypes: {
    ASC: 'ASC',
    DESC: 'DESC'
  },

  rows: null,

  getColumnWidth: function(rows, measureMethod, columnMinWidth) {
    var columnWidth = {};
    var self = this;
    if (self.props.autoColumnWidth) {
      var rulerWidth = 0;
      _.each(rows, function(row) {
        _.each(row, function(data, attr) {
          if (data) {
            if (!columnWidth.hasOwnProperty(attr)) {
              columnWidth[attr] = 0;
            }
            switch (measureMethod) {
              case 'jquery':
                var ruler = $("#ruler");
                ruler.css('font-size', '14px');
                ruler.text(data);
                rulerWidth = ruler.outerWidth();
                break;
              default:
                rulerWidth = data.toString().toUpperCase().length * 12;
                break;
            }

            columnWidth[attr] = columnWidth[attr] < rulerWidth ? rulerWidth : columnWidth[attr];
          }
        });
      });

      //20px is the padding.
      columnWidth = _.object(_.map(columnWidth, function(length, attr) {
        return [attr, length > self.props.columnMaxWidth ?
          self.props.columnMaxWidth :
          ( (length + 20) < columnMinWidth ?
            columnMinWidth : (length + 20))];
      }));
    }
    return columnWidth;
  },

  getShortLabels: function(rows, cols, columnWidth, measureMethod) {
    var cellShortLabels = [];
    var headerShortLabels = {};

    _.each(rows, function(row) {
      var rowWidthObj = {};
      _.each(row, function(content, attr) {
        var _label = content;
        var _labelShort = _label;
        var _labelWidth;
        if (_label) {
          switch (measureMethod) {
            case 'jquery':
              var ruler = $('#ruler');
              ruler.text(_label);
              ruler.css('font-size', '14px');
              _labelWidth = ruler.outerWidth();
              break;
            default:
              _labelWidth = _label.toString().toUpperCase().length * 12;
              break;
          }
          if (_labelWidth > columnWidth[attr]) {
            var end = Math.floor(_label.length * columnWidth[attr] / _labelWidth) - 3;
            _labelShort = _label.substring(0, end) + '...';
          } else {
            _labelShort = _label;
          }
        }
        rowWidthObj[attr] = _labelShort;
      });
      cellShortLabels.push(rowWidthObj);
    });

    _.each(cols, function(col) {
      var _label = col.displayName;
      var _shortLabel = '';
      var _labelWidth;

      if (_label) {
        switch (measureMethod) {
          case 'jquery':
            var ruler = $('#ruler');
            ruler.text(_label);
            ruler.css('font-size', '14px');
            ruler.css('font-weight', 'bold');
            _labelWidth = ruler.outerWidth();
            break;
          default:
            _labelWidth = _label.toString().toUpperCase().length * 12;
            break;
        }
        if (_labelWidth > columnWidth[col.name]) {
          var end = Math.floor(_label.length * columnWidth[col.name] / _labelWidth) - 3;
          _shortLabel = _label.substring(0, end) + '...';
        } else {
          _shortLabel = _label;
        }
      }
      headerShortLabels[col.name] = _shortLabel;
    });

    return {
      cell: cellShortLabels,
      header: headerShortLabels
    };
  },
  // Filters rows by selected column
  filterRowsBy: function(filterAll, filters) {
    var rows = this.rows.slice();
    var filterRowsStartIndex = [];
    var filteredRows = _.filter(rows, function(row, index) {
      var allFlag = false; // Current row contains the global keyword
      for (var col in filters) {
        if (!filters[col].hide) {
          if (filters[col].type == "STRING") {
            if (!row[col]) {
              if (filters[col].key.length > 0) {
                return false;
              }
            } else {
              if (row[col].toLowerCase().indexOf(filters[col].key.toLowerCase()) < 0) {
                return false;
              }
              if (row[col].toLowerCase().indexOf(filterAll.toLowerCase()) >= 0) {
                allFlag = true;
              }
            }
          } else if (filters[col].type == "NUMBER") {
            if (!isNaN(row[col])) {
              if (Number(row[col]) < filters[col].min) {
                return false;
              }
              if (Number(row[col]) > filters[col].max) {
                return false;
              }
            }
          }
        }
      }
      if (allFlag) {
        filterRowsStartIndex.push(index);
      }
      return allFlag;
    });

    filteredRows = filteredRows.map(function(item, index) {
      return {
        row: item,
        index: filterRowsStartIndex[index]
      }
    });
    return filteredRows;
  },

  // Sorts rows by selected column
  sortRowsBy: function(filteredRows, sortBy, switchDir) {
    var type = this.state.filters[sortBy].type, sortDir = this.state.sortDir,
      SortTypes = this.SortTypes;
    if (switchDir) {
      if (sortBy === this.state.sortBy) {
        sortDir = this.state.sortDir === SortTypes.ASC ? SortTypes.DESC : SortTypes.ASC;
      } else {
        sortDir = SortTypes.DESC;
      }
    }

    filteredRows.sort(function(a, b) {
      var sortVal = 0, aVal = a.row[sortBy], bVal = b.row[sortBy];
      if (type == "NUMBER") {
        aVal = (aVal && !isNaN(aVal)) ? Number(aVal) : aVal;
        bVal = (bVal && !isNaN(bVal)) ? Number(bVal) : bVal;
      }
      if (typeof aVal != "undefined" && !isNaN(aVal) && typeof bVal != "undefined" && !isNaN(bVal)) {
        if (aVal > bVal) {
          sortVal = 1;
        }
        if (aVal < bVal) {
          sortVal = -1;
        }

        if (sortDir === SortTypes.ASC) {
          sortVal = sortVal * -1;
        }
      } else if (typeof aVal != "undefined" && typeof bVal != "undefined") {
        if (!isNaN(aVal)) {
          sortVal = -1;
        } else if (!isNaN(bVal)) {
          sortVal = 1;
        }
        else {
          if (aVal > bVal) {
            sortVal = 1;
          }
          if (aVal < bVal) {
            sortVal = -1;
          }

          if (sortDir === SortTypes.ASC) {
            sortVal = sortVal * -1;
          }
        }
      } else if (aVal) {
        sortVal = -1;
      }
      else {
        sortVal = 1;
      }

      return sortVal;
    });

    return {filteredRows: filteredRows, sortDir: sortDir};
  },

  // Sorts and sets state
  sortNSet: function(sortBy) {
    var result = this.sortRowsBy(this.state.filteredRows, sortBy, true);
    this.setState({
      filteredRows: result.filteredRows,
      sortBy: sortBy,
      sortDir: result.sortDir
    });
  },

  // Filters, sorts and sets state
  filterSortNSet: function(filterAll, filters, sortBy) {
    var filteredRows = this.filterRowsBy(filterAll, filters);
    var result = this.sortRowsBy(filteredRows, sortBy, false);
    this.setState({
      filteredRows: result.filteredRows,
      sortBy: sortBy,
      sortDir: result.sortDir,
      filterAll: filterAll,
      filters: filters
    });
  },

  // Operations when filter keyword changes
  onFilterKeywordChange: function(e) {
    ++this.state.filterTimer;

    var self = this;
    var id = setTimeout(function() {
      var filterAll = self.state.filterAll, filters = self.state.filters;
      if (e.target.getAttribute("data-column") == "all") {
        filterAll = e.target.value;
      } else {
        filters[e.target.getAttribute("data-column")].key = e.target.value;
      }
      self.filterSortNSet(filterAll, filters, self.state.sortBy);
      --self.state.filterTimer;
    }, 500);

    if (this.state.filterTimer > 1) {
      clearTimeout(id);
      --self.state.filterTimer;
    }
  },

  // Operations when filter range changes
  onFilterRangeChange: function(column, min, max) {
    ++this.state.filterTimer;

    var self = this;
    var id = setTimeout(function() {
      var filters = self.state.filters;
      filters[column].min = min;
      filters[column].max = max;
      self.filterSortNSet(self.state.filterAll, filters, self.state.sortBy);
      --self.state.filterTimer;
    }, 500);

    if (this.state.filterTimer > 1) {
      clearTimeout(id);
      --self.state.filterTimer;
    }
  },

  // Operations when reset all filters
  onResetFilters: function() {
    var filters = this.state.filters;
    _.each(filters, function(filter) {
      if (!_.isUndefined(filter._key)) {
        filter.key = filter._key;
      }
      if (!_.isUndefined(filter._min)) {
        filter.min = filter._min;
      }
      if (!_.isUndefined(filter._max)) {
        filter.max = filter._max;
      }
      filter.reset = true;
    });
    this.filterSortNSet('', filters, this.state.sortBy);
  },

  updateCols: function(cols, filters) {
    var filteredRows = this.filterRowsBy(this.state.filterAll, filters);
    var result = this.sortRowsBy(filteredRows, this.state.sortBy, false);
    this.setState({
      cols: cols,
      filteredRows: result.filteredRows,
      filters: filters
    });
  },

  updateGoToColumn: function(val) {
    this.setState({
      goToColumn: val
    });
  },

  // Processes input data, and initializes table states
  getInitialState: function() {
    var cols = [], rows = [], rowsDict = {}, attributes = this.props.input.attributes,
      data = this.props.input.data, dataLength = data.length, col, cell, i, filters = {},
      uniqueId = this.props.uniqueId || 'id', newCol,
      measureMethod = dataLength > 100000 ? 'charNum' : 'jquery',
      columnMinWidth = this.props.groupHeader ? 130 : 50; //The minimum width to at least fit in number slider.

    // Gets column info from input
    var colsDict = {};
    for (i = 0; i < attributes.length; i++) {
      col = attributes[i];
      newCol = {
        displayName: col.display_name,
        name: col.attr_id,
        type: col.datatype,
        fixed: false,
        show: true
      };

      if (col.hasOwnProperty('column_width')) {
        newCol.width = col.column_width;
      }
      cols.push(newCol);
      colsDict[col.attr_id] = i;
    }

    // Gets fixed info from configuration
    var fixedArray = this.props.fixed;
    for (i = 0; i < fixedArray.length; i++) {
      var elem = fixedArray[i];
      switch (typeof elem) {
        case "number":
          cols[elem].fixed = true;
          break;
        case "string":
          cols[colsDict[elem]].fixed = true;
          break;
      }
    }

    // Gets data rows from input
    for (i = 0; i < dataLength; i++) {
      cell = data[i];
      if (!rowsDict[cell[uniqueId]]) {
        rowsDict[cell[uniqueId]] = {};
      }
      rowsDict[cell[uniqueId]][cell.attr_id] = cell.attr_val;
    }

    _.each(rowsDict, function(item, i) {
      rowsDict[i][uniqueId] = i;
      rows.push(rowsDict[i]);
    });

    // Gets the range of number type features
    for (i = 0; i < cols.length; i++) {
      col = cols[i];
      if (col.type == "NUMBER") {
        var min = Number.MAX_VALUE, max = -Number.MAX_VALUE;
        for (var j = 0; j < rows.length; j++) {
          cell = rows[j][col.name];
          if (typeof cell != "undefined" && !isNaN(cell)) {
            cell = Number(cell);
            max = cell > max ? cell : max;
            min = cell < min ? cell : min;
          }
        }
        if (max === -Number.MAX_VALUE || min === Number.MIN_VALUE) {
          filters[col.name] = {type: "STRING", key: "", _key: "", hide: false};
        } else {
          col.max = max;
          col.min = min;
          filters[col.name] = {
            type: "NUMBER",
            min: min,
            _min: min,
            max: max,
            _max: max,
            hide: false
          };
        }
      } else {
        filters[col.name] = {type: "STRING", key: "", _key: "", hide: false};
      }
    }

    cols = _.sortBy(cols, function(obj) {
      if (!_.isUndefined(obj.displayName)) {
        return obj.displayName;
      } else {
        return obj.name;
      }
    });
    this.rows = rows;

    var columnWidths = this.getColumnWidth(rows, measureMethod, columnMinWidth);
    var shortLabels = this.getShortLabels(rows, cols, columnWidths, measureMethod);

    return {
      cols: cols,
      rowsSize: rows.length,
      filteredRows: null,
      filterAll: "",
      filters: filters,
      sortBy: uniqueId,
      sortDir: this.SortTypes.DESC,
      goToColumn: null,
      filterTimer: 0,
      shortLabels: shortLabels,
      columnWidths: columnWidths,
      columnMinWidth: columnMinWidth
    };
  },

  // Initializes filteredRows before first rendering
  componentWillMount: function() {
    this.filterSortNSet(this.state.filterAll, this.state.filters, this.state.sortBy);
  },

  // Activates range sliders after first rendering
  componentDidMount: function() {
    var onFilterRangeChange = this.onFilterRangeChange;
    $('.rangeSlider')
      .each(function() {
        var min = Math.floor(Number($(this).attr('data-min')) * 100) / 100, max = Math.round(Number($(this).attr('data-max')) * 100) / 100,
          column = $(this).attr('data-column'), diff = max - min, step = 1;

        if (diff < 0.01) {
          step = 0.001;
        } else if (diff < 0.1) {
          step = 0.01;
        } else if (diff < 2) {
          step = 0.1;
        }

        $(this).slider({
          range: true,
          min: min,
          max: max,
          step: step,
          values: [min, max],
          change: function(event, ui) {
            $("#range-" + column).text(ui.values[0] + " to " + ui.values[1]);
            onFilterRangeChange(column, ui.values[0], ui.values[1]);
          }
        });
        $("#range-" + column).text(min + " to " + max);
      });
  },

  // Sets default properties
  getDefaultProps: function() {
    return {
      filter: "NONE",
      download: "NONE",
      showHide: false,
      hideFilter: true,
      scroller: false,
      resultInfo: true,
      groupHeader: true,
      fixed: [],
      downloadFileName: 'data.txt',
      autoColumnWidth: true,
      columnMaxWidth: 300
    };
  },

  render: function() {
    var sortDirArrow = this.state.sortDir === this.SortTypes.DESC ? 'fa fa-sort-desc' : 'fa fa-sort-asc';

    return (
      <div className="EFDT-table">
        <div className="EFDT-table-prefix row">
          <TablePrefix cols={this.state.cols} rows={this.rows}
                       onFilterKeywordChange={this.onFilterKeywordChange}
                       onResetFilters={this.onResetFilters}
                       filters={this.state.filters}
                       updateCols={this.updateCols}
                       updateGoToColumn={this.updateGoToColumn}
                       scroller={this.props.scroller}
                       filter={this.props.filter}
                       hideFilter={this.props.hideFilter}
                       getData={this.props.download}
                       downloadFileName={this.props.downloadFileName}
                       hider={this.props.showHide}
                       fixedChoose={this.props.fixedChoose}
                       resultInfo={this.props.resultInfo}
                       rowsSize={this.state.rowsSize}
                       filteredRowsSize={this.state.filteredRows.length}
          />
        </div>
        <div className="EFDT-tableMain row">
          <TableMainPart cols={this.state.cols}
                         filteredRows={this.state.filteredRows}
                         filters={this.state.filters}
                         sortNSet={this.sortNSet}
                         onFilterKeywordChange={this.onFilterKeywordChange}
                         goToColumn={this.state.goToColumn}
                         sortBy={this.state.sortBy}
                         sortDirArrow={sortDirArrow}
                         filterAll={this.state.filterAll}
                         filter={this.props.filter}
                         rowHeight={this.props.rowHeight}
                         tableWidth={this.props.tableWidth}
                         maxHeight={this.props.maxHeight}
                         headerHeight={this.props.headerHeight}
                         groupHeaderHeight={this.props.groupHeaderHeight}
                         groupHeader={this.props.groupHeader}
                         shortLabels={this.state.shortLabels}
                         columnWidths={this.state.columnWidths}
          />
        </div>
      </div>
    );
  }
});
