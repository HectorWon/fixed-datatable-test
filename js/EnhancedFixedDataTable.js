var FileGrabber = React.createClass({
    // Download
    saveFile: function () {
        var blob = new Blob([this.props.content], {type: 'text/plain'});
        var fileName = "test.txt";

        var downloadLink = document.createElement("a");
        downloadLink.download = fileName;
        downloadLink.innerHTML = "Download File";
        if (window.webkitURL != null) {
            // Chrome allows the link to be clicked
            // without actually adding it to the DOM.
            downloadLink.href = window.webkitURL.createObjectURL(blob);
        }
        else {
            // Firefox requires the link to be added to the DOM
            // before it can be clicked.
            downloadLink.href = window.URL.createObjectURL(blob);
            downloadLink.onclick = function (event) {
                document.body.removeChild(event.target);
            };
            downloadLink.style.display = "none";
            document.body.appendChild(downloadLink);
        }

        downloadLink.click();
    },

    render: function () {
        return (
            <button onClick={this.saveFile}>DATA</button>
        );
    }
});

var ClipboardGrabber = React.createClass({
    componentDidMount: function () {
        var client = new ZeroClipboard($("#copy-button")), content = this.props.content;
        client.on("ready", function (readyEvent) {
            client.on("copy", function (event) {
                event.clipboardData.setData('text/plain', content);
            });
        })
    },

    render: function () {
        return (
            <button id="copy-button">COPY</button>
        );
    }
});

var DataGrabber = React.createClass({
    // Prepare the content to download or copy
    prepareContent: function () {
        var content = '', cols = this.props.cols, rows = this.props.rows;

        cols.forEach(function (e) {
            content = content + (e.displayName || 'Unknown') + '\t';
        });
        content = content.slice(0, -1);

        rows.forEach(function (e) {
            content += '\r\n';
            cols.forEach(function (e1) {
                content += e[e1.name] + '\t';
            });
            content = content.slice(0, -1);
        });

        return content;
    },

    render: function () {
        var content = this.prepareContent();

        return (
            <div>
                <div style={{float:"left",width:"50%",textAlign:"center"}}>
                    <FileGrabber content={content}/></div>
                <div style={{float:"left",width:"50%",textAlign:"center"}}>
                    <ClipboardGrabber content={content}/></div>
            </div>
        );
    }
});

var QtipWrapper = React.createClass({
    render: function () {
        var label = this.props.rawLabel, qtipFlag = false;
        if (label && label.length > 20) {
            qtipFlag = true;
            label = label.substring(0, 20) + '...';
        }
        return (
            <span className={qtipFlag?"hasQtip":""} data-qtip={this.props.rawLabel}>
                {label}
            </span>
        );
    }
});

var ColumnHider = React.createClass({
    tableCols: [],

    // Hide columns
    hideColumns: function (list) {
        var cols = this.props.cols;
        for (var i = 0; i < list.length; i++) {
            cols[i].show = list[i].isChecked;
        }
        this.props.updateCols(cols);
    },

    componentWillMount: function () {
        var cols = this.props.cols;
        for (var i = 0; i < cols.length; i++) {
            this.tableCols.push({id: cols[i].name, label: cols[i].displayName, isChecked: true});
        }
    },

    componentDidMount: function () {
        var hideColumns = this.hideColumns;

        $("#hide_column_checklist").dropdownCheckbox({
            data: this.tableCols,
            autosearch: true,
            title: "Show / Hide Columns",
            hideHeader: false,
            showNbSelected: true
        });

        $("#hide_column_checklist").on("change", function () {
            var list = ($("#hide_column_checklist").dropdownCheckbox("items"));
            hideColumns(list);
        });
    },

    render: function () {
        return (
            <div id="hide_column_checklist"></div>
        );
    }
});

var ColumnScroller = React.createClass({
    // Scroll to user selected column
    scrollToColumn: function (e) {
        var name = e.target.value, cols = this.props.cols, index;
        for (var i = 0; i < cols.length; i++) {
            if (name === cols[i].name) {
                index = i;
                break;
            }
        }
        this.props.updateGoToColumn(index);
    },

    render: function () {
        return (
            <Chosen data-placeholder="Column Scroller" onChange={this.scrollToColumn}>
                {
                    this.props.cols.map(function (col) {
                        return (
                            <option value={col.name}>
                                {col.displayName}
                            </option>
                        )
                    })
                }
            </Chosen>
        );
    }
});

var Filter = React.createClass({
    render: function () {
        switch (this.props.type) {
            case "NUMBER":
                return (
                    <div>
                        <input type="text" id={"range-"+this.props.name} readOnly
                               style={{border:0,color:"#f6931f"}}></input>

                        <div className="rangeSlider" data-max={this.props.max}
                             data-min={this.props.min} data-column={this.props.name}></div>
                    </div>
                );
            case "STRING":
            default :
                return (
                    <input placeholder="Input a keyword" data-column={this.props.name}
                           onChange={this.props.onFilterKeywordChange}/>
                );
        }
    }
});

var TablePrefix = React.createClass({
    render: function () {
        return (
            <div>
                <div>
                    <div style={{width:"50%",textAlign:"center"}}>
                        <ColumnHider cols={this.props.cols} updateCols={this.props.updateCols}/>
                    </div>
                    <div style={{width:"50%",textAlign:"center"}}>
                        <DataGrabber cols={this.props.cols} rows={this.props.rows}/>
                    </div>
                </div>
                <div>
                    <div style={{width:"50%",textAlign:"center"}}>
                        <ColumnScroller cols={this.props.cols}
                                        updateGoToColumn={this.props.updateGoToColumn}/>
                    </div>
                    <div style={{width:"50%",textAlign:"center"}}>
                        <Filter type="STRING" name="all"
                                onFilterKeywordChange={this.props.onFilterKeywordChange}/>
                    </div>
                </div>
            </div>
        );
    }
});

var HeaderWrapper = React.createClass({
    render: function () {
        var columnData = this.props.columnData;
        return (
            <a href="#" onClick={this.props.sortNSet.bind(null, this.props.cellDataKey)}>
                <QtipWrapper rawLabel={columnData.displayName}/>
                {columnData.sortFlag ? columnData.sortDirArrow : ""}
            </a>
        );
    }
});

var TableMainPart = React.createClass({
    // Get the filtered rows
    rowGetter: function (rowIndex) {
        return this.props.filteredRows[rowIndex];
    },

    // React-renderable content for group header cells
    renderGroupHeader: function (_1, _2, columnGroupData) {
        return (
            <Filter type={columnGroupData.type} name={columnGroupData.name}
                    max={columnGroupData.max} min={columnGroupData.min}
                    onFilterKeywordChange={this.props.onFilterKeywordChange}/>
        );
    },

    // React-renderable content for header cells
    renderHeader: function (_1, cellDataKey, columnData) {
        return (
            <HeaderWrapper cellDataKey={cellDataKey} columnData={columnData}
                           sortNSet={this.props.sortNSet}
                />
        );
    },

    // React-renderable content for cells
    renderCell: function (cellData, _1, _2, _3, columnData) {
        var flag = (cellData && columnData.filterAll.length > 0)
            ? (cellData.toLowerCase().indexOf(columnData.filterAll.toLowerCase()) >= 0) : false;
        return (
            <span style={flag ? {backgroundColor:'yellow'} : {}}>
                <QtipWrapper rawLabel={cellData}/>
            </span>
        );
    },

    componentDidMount: function () {
        $('.hasQtip')
            .each(function () {
                $(this).qtip({
                    content: {text: $(this).attr('data-qtip')},
                    hide: {fixed: true, delay: 100},
                    style: {classes: 'qtip-light qtip-rounded qtip-shadow', tip: true},
                    position: {my: 'center left', at: 'center right', viewport: $(window)}
                });
            });
    },

    onScrollEnd: function () {
        $(document).ready(function () {
            $('.hasQtip')
                .each(function () {
                    $(this).qtip({
                        content: {text: $(this).attr('data-qtip')},
                        hide: {fixed: true, delay: 100},
                        style: {classes: 'qtip-light qtip-rounded qtip-shadow', tip: true},
                        position: {my: 'center left', at: 'center right', viewport: $(window)}
                    });
                });
        });
    },

    render: function () {
        var Table = FixedDataTable.Table, Column = FixedDataTable.Column,
            ColumnGroup = FixedDataTable.ColumnGroup, props = this.props,
            renderGroupHeader = this.renderGroupHeader, renderHeader = this.renderHeader,
            renderCell = this.renderCell;
        return (
            <Table
                rowHeight={50}
                rowGetter={this.rowGetter}
                onScrollEnd={this.onScrollEnd}
                rowsCount={props.filteredRows.length}
                width={1000}
                maxHeight={500}
                headerHeight={50}
                groupHeaderHeight={50}
                scrollToColumn={props.goToColumn}
                >
                {
                    props.cols.map(function (col) {
                        return (
                            <ColumnGroup
                                groupHeaderRenderer={renderGroupHeader}
                                columnGroupData={{name:col.name,type:col.type,max:col.max,min:col.min}}
                                fixed={col.fixed}
                                align="center"
                                >
                                <Column
                                    headerRenderer={renderHeader}
                                    cellRenderer={renderCell}
                                    // Flag is true when table is sorted by this column
                                    columnData={{displayName:col.displayName,sortFlag:props.sortBy === col.name,
                                    sortDirArrow:props.sortDirArrow,filterAll:props.filterAll,type:col.type}}
                                    width={col.show ? 200 : 0}
                                    dataKey={col.name}
                                    fixed={col.fixed}
                                    allowCellsRecycling={true}
                                    />
                            </ColumnGroup>
                        );
                    })
                }
            </Table>
        );
    }
});

var EnhancedFixedDataTable = React.createClass({
    SortTypes: {
        ASC: 'ASC',
        DESC: 'DESC'
    },

    rows: null,

    // Filter rows by selected column
    filterRowsBy: function (filterAll, filters) {
        var rows = this.rows.slice();
        var filteredRows = rows.filter(function (row) {
            var allFlag = false; // Current row contains the global keyword
            for (var col in filters) {
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
                    if (!row[col] || isNaN(row[col])) {
                    } else {
                        if (Number(row[col]) < filters[col].min) {
                            return false;
                        }
                        if (Number(row[col]) > filters[col].max) {
                            return false;
                        }
                    }
                }
            }
            return allFlag;
        });

        return filteredRows;
    },

    // Sort rows by selected column
    sortRowsBy: function (filteredRows, sortBy, switchDir) {
        var type = this.state.filters[sortBy].type, sortDir = this.state.sortDir,
            SortTypes = this.SortTypes;
        if (switchDir) {
            if (sortBy === this.state.sortBy) {
                sortDir = this.state.sortDir === SortTypes.ASC ? SortTypes.DESC : SortTypes.ASC;
            } else {
                sortDir = SortTypes.DESC;
            }
        }

        filteredRows.sort(function (a, b) {
            var sortVal = 0, aVal = a[sortBy], bVal = b[sortBy];
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

    // Sort and set state
    sortNSet: function (sortBy) {
        var result = this.sortRowsBy(this.state.filteredRows, sortBy, true);
        this.setState({
            filteredRows: result.filteredRows,
            sortBy: sortBy,
            sortDir: result.sortDir
        });
    },

    // Filter, sort and set state
    filterSortNSet: function (filterAll, filters, sortBy) {
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
    onFilterKeywordChange: function (e) {
        var filterAll = this.state.filterAll, filters = this.state.filters;
        if (e.target.getAttribute("data-column") == "all") {
            filterAll = e.target.value;
        } else {
            filters[e.target.getAttribute("data-column")].key = e.target.value;
        }
        this.filterSortNSet(filterAll, filters, this.state.sortBy);
    },

    // Operations when filter range changes
    onFilterRangeChange: function (column, min, max) {
        var filters = this.state.filters;
        filters[column].min = min;
        filters[column].max = max;
        this.filterSortNSet(this.state.filterAll, filters, this.state.sortBy);
    },

    updateCols: function (val) {
        this.setState({
            cols: val
        });
    },

    updateGoToColumn: function (val) {
        this.setState({
            goToColumn: val
        });
    },

    getInitialState: function () {
        var cols = [], rows = [], rowsDict = {}, attributes = this.props.json.attributes,
            data = this.props.json.data, col, cell, i, filters = {};

        // Get column info from json
        cols.push({displayName: "Sample ID", name: "sample", type: "STRING", fixed: true, show: true});
        for (i = 0; i < attributes.length; i++) {
            col = attributes[i];
            cols.push({
                displayName: col.display_name,
                name: col.attr_id,
                type: col.datatype,
                fixed: false,
                show: true
            });
        }

        // Get data rows from json
        for (i = 0; i < data.length; i++) {
            cell = data[i];
            if (!rowsDict[cell.sample]) rowsDict[cell.sample] = {};
            rowsDict[cell.sample][cell.attr_id] = cell.attr_val;
        }
        for (i in rowsDict) {
            rowsDict[i].sample = i;
            rows.push(rowsDict[i]);
        }

        // Get the range of number type features
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
                col.max = max;
                col.min = min;
                filters[col.name] = {type: "NUMBER", min: min, max: max};
            } else {
                filters[col.name] = {type: "STRING", key: ""};
            }
        }

        this.rows = rows;
        return {
            cols: cols,
            filteredRows: null,
            filterAll: "",
            filters: filters,
            sortBy: 'sample',
            sortDir: this.SortTypes.DESC,
            goToColumn: null
        };
    },

    componentWillMount: function () {
        this.filterSortNSet(this.state.filterAll, this.state.filters, this.state.sortBy);
    },

    componentDidMount: function () {
        var onFilterRangeChange = this.onFilterRangeChange;
        $('.rangeSlider')
            .each(function () {
                var min = Number($(this).attr('data-min')), max = Number($(this).attr('data-max')),
                    column = $(this).attr('data-column');
                $(this).slider({
                    range: true,
                    min: min,
                    max: max,
                    values: [min, max],
                    slide: function (event, ui) {
                        $("#range-" + column).val(ui.values[0] + " to " + ui.values[1]);
                        onFilterRangeChange(column, ui.values[0], ui.values[1]);
                    }
                });
                $("#range-" + column).val(min + " to " + max);
            });
    },

    render: function () {
        var sortDirArrow = this.state.sortDir === this.SortTypes.DESC ? ' ↓' : ' ↑';

        return (
            <div style={{margin:"5% 10% 5% 10%"}}>
                <div style={{textAlign:"center"}}>
                    <TablePrefix cols={this.state.cols} rows={this.rows}
                                 onFilterKeywordChange={this.onFilterKeywordChange}
                                 updateCols={this.updateCols}
                                 updateGoToColumn={this.updateGoToColumn}
                        />
                </div>
                <div style={{textAlign:"center"}}>
                    <TableMainPart cols={this.state.cols} filteredRows={this.state.filteredRows}
                                   sortNSet={this.sortNSet} onFilterKeywordChange={this.onFilterKeywordChange}
                                   goToColumn={this.state.goToColumn} sortBy={this.state.sortBy}
                                   sortDirArrow={sortDirArrow} filterAll={this.state.filterAll}
                        />
                </div>
            </div>
        );
    }
});

var url = "https://rawgit.com/cBioPortal/enhanced-fixed-datatable/master/standalone-example/data/webservice_main.json";

$.getJSON(url, function (json) {
    React.render(<EnhancedFixedDataTable json={json}/>, document.body);
});