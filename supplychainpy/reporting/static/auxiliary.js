/**
 * Created by Fasusi on 22/05/2016.
 */
const $ = require('jquery');

$("document").ready(function () {
    $('div.nav-tab').hover(highlight);
    $('#classifications-btn').click(function () {
        toggle_reporting_view('collapse-classification');
    });

    $('#shortages-btn').click(function () {
        toggle_reporting_view('collapse-shortages');
    });

    $('#excess-btn').click(function () {
        toggle_reporting_view('collapse-excess');
    });
    // ajax request for json containing sku related. Is used to: builds revenue chart (#chart).

    var filters = [{"name": "shortage_cost", "op": "gt", "val": 0, "direction": "desc", "limit": 10}];
    var excess_filters = [{"name": "excess_cost", "op": "gt", "val": 0, "direction": "desc", "limit": 10}];

    $.ajax({
        type: "GET",
        contentType: "application/json; charset=utf-8",
        url: 'http://127.0.0.1:5000/api/inventory_analysis',
        dataType: 'json',
        async: true,
        data: {"q": JSON.stringify({"filters": filters})},
        success: function (data) {
            //console.log(data.objects);
            create_shortages_table(data);
        },
        error: function (result) {


        }
    });

        $.ajax({
        type: "GET",
        contentType: "application/json; charset=utf-8",
        url: 'http://127.0.0.1:5000/api/inventory_analysis',
        dataType: 'json',
        async: true,
        data: {"q": JSON.stringify({"filters": excess_filters})},
        success: function (data) {
            //console.log(data.objects);
            create_excess_table(data);
        },
        error: function (result) {


        }
    });


    $.ajax({
        type: "GET",
        contentType: "application/json; charset=utf-8",
        url: 'http://127.0.0.1:5000/reporting/api/v1.0/sku_detail',
        dataType: 'json',
        async: true,
        data: "{}",
        success: function (data) {
            //console.log(data);
            render_revenue_graph(data, '#chart');

        },
        error: function (result) {


        }
    });

    //ajax request for json containing all costs summarised by product class (abcxyz), builds pie chart (#chart2)
    $.ajax({
        type: "GET",
        contentType: "application/json; charset=utf-8",
        url: 'http://127.0.0.1:5000/reporting/api/v1.0/abc_summary',
        dataType: 'json',
        async: true,
        data: "{}",
        success: function (data) {
            //console.log(data);
            var pie_chart1 = new RenderPieChart(data, '#pie-shortage');
            pie_chart1.shortages();
            var pie_chart2 = new RenderPieChart(data, '#excess-pie');
            pie_chart2.excess();
            create_classification_table(data);
            var pie_chart3 = new RenderPieChart(data, '#class-chart');
            pie_chart3.excess_classification();

        },
        error: function (result) {
            //console.log(result);// make 404.html page
        }
    });

    //ajax request for json containing all costs summarised by product class (abcxyz), builds pie chart (#chart2)
    $.ajax({
        type: "GET",
        contentType: "application/json; charset=utf-8",
        url: 'http://127.0.0.1:5000/reporting/api/v1.0/top_shortages',
        dataType: 'json',
        async: true,
        data: "{}",
        success: function (data) {
            //console.log(data);

            render_shortages_chart(data, '#shortage-chart');

        },
        error: function (result) {
            //console.log(result);// make 404.html page
        }
    });


    $.ajax({
        type: "GET",
        contentType: "application/json; charset=utf-8",
        url: 'http://127.0.0.1:5000/reporting/api/v1.0/top_excess',
        dataType: 'json',
        async: true,
        data: "{}",
        success: function (data) {
            //console.log(data);
            render_excess_chart(data, '#excess-chart');

        },
        error: function (result) {
            //console.log(result);// make 404.html page
        }
    });

});

function format_number(num) {
    return num.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");

}

// helper functions for unpacking data from ajax requests
var unpack = {
    attribute_enum: {
        revenue: 'revenue',
        shortage_cost: 'shortage_cost',
        shortages: 'shortages'

    },

    sku_detail: function (data, value) {
        var barData = [];
        var tempData;
        var key;
        var i;
        for (key in data) {
            tempData = data[key];
            //console.log(tempData);
            for (i in tempData) {
                //.log(tempData[i].revenue);
                switch (value) {
                    case unpack.attribute_enum.revenue:
                        barData.push(tempData[i].revenue);
                        //console.log(barData);
                        break;
                    case upack.attribute_enum.shoratge_cost:
                        barData.push(tempData[i].shoratge_cost);
                }

            }

        }
        return barData;
    },

    excess: function (data, target) {
        var excess_data = [];
        var tempData;
        var key;
        for (key in data) {
            tempData = data[key];
            //console.log(tempData);
            for (i in tempData) {
                //console.log(tempData[i]);
                switch (target) {

                    case 'chart':
                        excess_data.push([tempData[i].abc_xyz_classification, tempData[i].total_excess]);
                        //console.log (excess_data);
                        break;

                    case 'table':
                        excess_data.push(tempData[i]);
                        //console.log(excess_data);
                        break;
                }

            }

        }
        return excess_data;
    },

    pie: function (data) {
        var pieData = [];
        var tempData;
        var key;

        for (key in data) {
            tempData = data[key];
            //console.log(tempData);
            for (i in tempData) {
                //console.log(tempData[i]);
                pieData.push([tempData[i].abc_xyz_classification, tempData[i].total_shortages]);
                //onsole.log(pieData);
            }


        }
        return pieData;
    },

    shortages: function (data, target) {
        var shortages_data = [];
        var tempData;
        var key;
        var i;
        for (key in data) {
            tempData = data[key];
            //console.log(tempData);
            for (i in tempData) {
                //console.log(tempData[i]);
                switch (target) {

                    case 'chart':
                        shortages_data.push([tempData[i].sku_id, tempData[i].shortage_cost]);
                        //console.log(shortages_data);
                        break;

                    case 'table':
                        shortages_data.push(tempData[i]);
                        //console.log(shortages_data);
                        break;
                }

            }

        }
        return shortages_data;
    },
    excess_cost: function (data, target) {
        var excess_data = [];
        var tempData;
        var key;
        var i;
        for (key in data) {
            tempData = data[key];
            //console.log(tempData);
            for (i in tempData) {
                //console.log(tempData[i]);
                switch (target) {

                    case 'chart':
                        excess_data.push([tempData[i].sku_id, tempData[i].excess_cost]);
                        //console.log(shortages_data);
                        break;

                    case 'table':
                        excess_data.push(tempData[i]);
                        //console.log(shortages_data);
                        break;
                }

            }

        }
        return excess_data;
    },

    excess_by_class: function (data, target, classification) {
        var excess_data = [];
        var tempData;
        var key;
        for (key in data) {
            tempData = data[key];
            //console.log(tempData[0]);
            for (i in tempData) {
                //console.log(tempData[i]);
                switch (target) {

                    case 'chart':
                        switch (classification) {
                            case 'AY':
                                if (tempData[i].abc_xyz_classification == 'AY') {
                                    excess_data.push([['excess', tempData[i].total_excess], ['revenue', tempData[i].total_revenue], ['shortage', tempData[i].total_shortages]]);
                                }
                        }
                        //console.log (excess_data);
                        break;

                    case 'table':
                        excess_data.push(tempData[i]);
                        //console.log(excess_data);
                        break;
                }

            }

        }
        //console.log(excess_data);
        return excess_data;
    },


    abc_xyz: function abc_xyz(data, target) {
        var abcxyz_data = [];
        var tempData;
        var key;
        var i;
        for (key in data) {
            tempData = data[key];
            //console.log(tempData);
            for (i in tempData) {
                //console.log(tempData[i]);
                switch (target) {

                    case 'chart':
                        abcxyz_data.push([tempData[i].sku_id, tempData[i].shortage_cost]);
                        //console.log(shortages_data);
                        break;

                    case 'table':
                        abcxyz_data.push(tempData[i]);
                        //console.log(shortages_data);
                        break;
                }
            }
        }
        return abcxyz_data;
    }

};

function highlight() {

    $(this).toggleClass('highlight-event');

}

function toggle_reporting_view(id) {
    $('#' + id).toggle("slow");
}

function sku_identifier(id) {

    var filters = [{"name": "sku_id", "op": "eq", "val": id}];

    $.ajax({
        type: "GET",
        contentType: "application/json; charset=utf-8",
        url: 'http://127.0.0.1:5000/api/inventory_analysis',
        dataType: 'json',
        async: true,
        data: {"q": JSON.stringify({"filters": filters})},
        success: function (data) {
            //console.log(data);

        },
        error: function (result) {


        }
    });

}

function create_shortages_table(data) {
    var total_shortage = 0;
    //console.log(data.objects);
    //var max_shortage = Math.max(data.shortage_cost);

    $("#shortage-table").append().html("<tr id='first'><th>SKU</th><th>Quantity on Hand</th><th>Average Orders</th>" +
        "<th>Shortage</th><th>Shortage Cost</th><th>Safety Stock</th><th>Reorder Level</th> " +
        "<th>Percentage Contribution</th><th>Revenue Rank</th><th>Classification</th></tr>");

    var t = [];
    var largest=0;
    for (var i = 0; i < data.objects.length; i++)  {
        //console.log(data.objects[i].shortage_cost);

        total_shortage += data.objects[i].shortage_cost;

        $("<tr><td><a href=\"sku_detail/" + data.objects[i].sku.sku_id + "\">" + data.objects[i].sku.sku_id + "</a></td>" +
            "<td>" + format_number(data.objects[i].quantity_on_hand) + "</td>" +
            "<td>" + format_number(Math.round(data.objects[i].average_orders)) + "</td>" +
            "<td>" + data.objects[i].shortages + "</td>" +
            "<td>" + format_number(data.objects[i].shortage_cost) + "</td>" +
            "<td>" + data.objects[i].safety_stock + "</td>" +
            "<td>" + data.objects[i].reorder_level + "</td>" +
            "<td>" + Math.round(data.objects[i].percentage_contribution_revenue * 100) + "%</td>" +
            "<td>" + data.objects[i].revenue_rank + "</td>" +
            "<td><a href=\"abcxyz/" + data.objects[i].abc_xyz_classification + "\">" + data.objects[i].abc_xyz_classification + "</a></td></tr>").insertAfter("#shortage-table tr:last");
        var shortage_sku_id;
        var shortage_units;

        if (parseInt(data.objects[i].shortage_cost) > parseInt(largest)) {
            largest = data.objects[i].shortage_cost;
            console.log(parseInt(largest));
            shortage_sku_id = data.objects[i].sku.sku_id;
            shortage_units = data.objects[i].shortages;
        }
    }


    $("#total-shortage").append().html("<h1><strong>" + format_number(total_shortage) + "</strong></h1>")
        .find("> h1").css("color", "#D11C29");
// top shortage pebble
    $("#lg-shortage-sku").append().html("<h1><strong>" + shortage_sku_id + "</strong></h1>")
        .find("> h1").css("color", "#2176C7");
    $("#lg-shortage-cost").append().html("<h1><strong>" + format_number(largest) + "</strong></h1>")
        .find("> h1").css("color", "#D11C29");

    $("#lg-shortage-units").append().html("<h1><strong>" + format_number(shortage_units) + " units" + "</strong></h1>")
        .find("> h1").css("color", "#819090");

}


function create_excess_table(data) {
    var total_excess = 0,
        percentage_excess = 0;

    $("#excess-table").append().html("<tr id='first'><th>SKU</th><th>Quantity on Hand</th><th>Average Orders</th>" +
        "<th>Excess</th><th>Excess Cost</th><th>Excess Inventory %</th><th>Safety Stock</th><th>Reorder Level</th><th>Classification</th></tr>");
    //console.log(excess_data);
    var obj;
     for (var i = 0; i < data.objects.length; i++) {
        //console.log(excess_data[obj].sku_id);
        total_excess += data.objects[i].excess_cost;
        percentage_excess = Math.round((data.objects[i].excess_stock / data.objects[i].quantity_on_hand) * 100);
        $("<tr><td><a href=\"sku_detail/" + data.objects[i].sku.sku_id  + "\">" + data.objects[i].sku.sku_id + "</td>" +
            "<td>" + data.objects[i].quantity_on_hand + "</td>" +
            "<td>" + data.objects[i].average_orders + "</td>" +
            "<td>" + data.objects[i].excess_stock + "</td>" +
            "<td>" + data.objects[i].excess_cost + "</td>" +
            "<td>" + percentage_excess + "%" + "</td>" +
            "<td>" + data.objects[i].safety_stock + "</td>" +
            "<td>" + data.objects[i].reorder_level + "</td>" +
            "<td><a href=\"abcxyz/" + data.objects[i].abc_xyz_classification + "\">" + data.objects[i].abc_xyz_classification + "</a></td></tr>").insertAfter("#excess-table tr:last");
    }

    // top excess pebble
    $("#lg-excess-sku").append().html("<h1><strong>" + excess_data[0].sku_id + "</strong></h1>")
        .find("> h1").css("color", "#2176C7");
    $("#lg-excess-cost").append().html("<h1><strong>" + "$" + excess_data[0].excess_cost + "</strong></h1>")
        .find("> h1").css("color", "#D11C29");
    $("#lg-excess-units").append().html("<h1><strong>" + excess_data[0].excess_stock + " units" + "</strong></h1>")
        .find("> h1").css("color", "#819090");
    $("#total-excess").append().html("<h1><strong>" + total_excess + "</strong></h1>")
        .find("> h1").css("color", "#D11C29");

}

function create_classification_table(data) {
    var abc_xyz_data = new unpack.abc_xyz(data, 'table');

    $("#classification-table").append().html("<tr id='classification-row'><th>Classification</th><th>Revenue</th><th>Shortages</th>" + "<th>Excess</th></tr>");
    //console.log(excess_data);

    var obj;
    for (obj in abc_xyz_data) {
        //console.log(abc_xyz_data[obj].abc_xyz_classification);
        $("<tr><td><a href=\"abcxyz/" + abc_xyz_data[obj].abc_xyz_classification + "\">" + abc_xyz_data[obj].abc_xyz_classification + "</a>"
            + "<td>" + format_number(abc_xyz_data[obj].total_revenue) + "</td>"
            + "<td>" + format_number(abc_xyz_data[obj].total_shortages) + "</td>"
            + "<td>" + format_number(abc_xyz_data[obj].total_excess) + "</td>"
            + "</td></tr>").insertAfter("#classification-table tr:last");
    }

    var max_shortage = 0;
    var max_class;
    var max_excess = 0;
    var excess_class;
    var total_shortages = 0;
    var total_excess = 0;
    var item;
    var tempValue;
    var tempClass;
    for (item in abc_xyz_data) {
        if (abc_xyz_data[item].total_shortages > max_shortage) {
            max_shortage = abc_xyz_data[item].total_shortages;
            max_class = abc_xyz_data[item].abc_xyz_classification;

        }
        if (abc_xyz_data[item].total_excess > max_excess) {
            max_excess = abc_xyz_data[item].total_excess;
            excess_class = abc_xyz_data[item].abc_xyz_classification;

        }
        total_shortages += abc_xyz_data[item].total_shortages;
        total_excess += abc_xyz_data[item].total_excess;
    }

    $("#lg-shortage-classification").append().html("<h1><strong>" + format_number(max_shortage) + "</strong></h1>")
        .find("> h1").css("color", "#2176C7");
    $("#lg-shortage-classification-class").append().html("<h1><strong>" + max_class + "</strong></h1>")
        .find("> h1").css("color", "#2176C7");
    $("#lg-excess-classification").append().html("<h1><strong>" + format_number(max_excess) + "</strong></h1>")
        .find("> h1").css("color", "#2176C7");
    $("#lg-excess-classification-class").append().html("<h1><strong>" + excess_class + "</strong></h1>")
        .find("> h1").css("color", "#2176C7");
    $("#lg-total-shortage").append().html("<h1><strong>" + format_number(total_shortages) + "</strong></h1>")
        .find("> h1").css("color", "#2176C7");
    $("#lg-total-excess").append().html("<h1><strong>" + format_number(total_excess) + "</strong></h1>")
        .find("> h1").css("color", "#2176C7");
}


class RenderPieChart {
    constructor(data, id) {
        this.data = data;
        this.id = id;

    }

    shortages() {
        //console.log(data);

        var width = 350;
        var height = 350;
        var radius = 175;
        var colors = d3.scale.ordinal()
            .range(['#259286', '#2176C7', '#FCF4DC', 'white', '#819090', '#A57706', '#EAE3CB', '#2e004d']);

        var pieData = unpack.pie(this.data);
        //console.log(pieData);

        var pie = d3.layout.pie()
            .value(function (d) {
                //console.log(d[1]);
                return d[1];
            });

        var arc = d3.svg.arc()
            .outerRadius(radius);

        var myChart = d3.select(this.id).append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', 'translate(' + (width - radius) + ',' + (height - radius) + ')')
            .selectAll('path').data(pie(pieData))
            .enter().append('g')
            .attr('class', 'slice');

        var slices = d3.selectAll('g.slice')
            .append('path')
            .attr('fill', function (d, i) {
                return colors(i);
            })
            .attr('opacity', .6)
            .attr('d', arc);

        var text = d3.selectAll('g.slice')
            .append('text')
            .text(function (d, i) {
                //console.log(d.data[0]);

                return d.data[0];

            })
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .attr('transform', function (d) {
                d.innerRadius = 0;
                d.outerRadius = radius;
                return 'translate(' + arc.centroid(d) + ')'
            });

    }

    excess() {
        //console.log(data);

        var width = 350;
        var height = 350;
        var radius = 175;
        var colors = d3.scale.ordinal()
            .range(['#259286', '#2176C7', '#FCF4DC', 'white', '#819090', '#A57706', '#EAE3CB', '#2e004d']);

        var pieData = unpack.excess(this.data, 'chart');
        //console.log(pieData);

        var pie = d3.layout.pie()
            .value(function (d) {
                //console.log(d[1]);
                return d[1];
            });

        var arc = d3.svg.arc()
            .outerRadius(radius);

        var myChart = d3.select(this.id).append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', 'translate(' + (width - radius) + ',' + (height - radius) + ')')
            .selectAll('path').data(pie(pieData))
            .enter().append('g')
            .attr('class', 'slice');

        var slices = d3.selectAll('g.slice')
            .append('path')
            .attr('fill', function (d, i) {
                return colors(i);
            })
            .attr('opacity', .6)
            .attr('d', arc);

        var text = d3.selectAll('g.slice')
            .append('text')
            .text(function (d, i) {
                //console.log(d.data);

                return d.data[0];

            })
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .attr('transform', function (d) {
                d.innerRadius = 0;
                d.outerRadius = radius;
                return 'translate(' + arc.centroid(d) + ')'
            });


    }

    excess_classification() {

    }

}

// --------------Graphing-----------------------


// change functions to graph rendering class
function render_revenue_graph(data, id) {
    var barData = unpack.sku_detail(data, "revenue");//change to enums
    var tempData = [];

    //console.log(barData);
    //var height = 350,
    //   width = 300,
    var margin = {top: 30, right: 20, bottom: 40, left: 90};

    var height = 350 - margin.top - margin.bottom;
    var width = 400 - margin.left - margin.right;
    var barWidth = 10;
    var barOffset = 5;

    var tempColor;


    var yScale = d3.scale.linear()
        .domain([0, d3.max(barData)]) //  calculates the max range of the chart area
        .range([0, height]); // the range of the chart area

    var xScale = d3.scale.ordinal()
        .domain(d3.range(0, barData.length))
        .rangeBands([0, width]);

    var colors = d3.scale.linear()
        .domain([0, barData.length * .33, barData.length * .88, barData.length])
        .range(['#FFB832', '#C61C6F', '#C31C6F', '#382982']); //the number of values in the domain must match the number of values in the range

    var myChart = d3.select(id).append('svg')
        .style('background', 'transparent')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')')
        .selectAll('rect').data(barData)
        .enter().append('rect') //the data command reads the bar data and the appends the selectall rect for each piece of data
        .style('fill', colors)
        .attr('width', xScale.rangeBand())
        .attr('height', 0)
        .attr('x', function (d, i) {
            return xScale(i);
        })
        .attr('y', height)
        .on('mouseover', function (d) {

            tooltip.transaction()
                .style('opacity', 0.5);
            tooltip.html(d)
                .style('left', (d3.event.pageX - 35) + 'px')
                .style('top', (d3.event.pageY - 30) + 'px');

            tempColor = this.style.fill;

            d3.select(this)
                .style('opacity', .5)
                .style('fill', '#389334')

        }).on('mouseout', function (d) {
            d3.select(this)
                .style('opacity', 1)
                .style('fill', tempColor)
        });

    myChart.transition()
        .attr('height', function (d) {
            return yScale(d);
        })
        .attr('y', function (d) {
            return height - yScale(d);
        })
        .delay(function (d, i) {
            return i * 20;
        })
        .duration(1000)
        .ease('elastic');


    var tooltip = d3.select('body')
        .append('div')
        .style('position', 'absolute')
        .style('background', 'white')
        .style('padding', '0 10px')
        .style('opacity', 0);

    var vGuideScale = d3.scale.linear()
        .domain([0, d3.max(barData)]).range([height, 0]); //reversing the order of the scale on the y axis
    var vAxis = d3.svg.axis()
        .scale(vGuideScale)
        .orient('left')
        .ticks(10);

    var vGuide = d3.select('svg').append('g');
    vAxis(vGuide);
    vGuide.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');
    vGuide.selectAll('path')
        .style({fill: 'none', stroke: "#000"});
    vGuide.selectAll('line')
        .style({stroke: "#000"});

    var hAxis = d3.svg.axis()
        .scale(xScale)
        .orient('bottom')
        .tickValues(xScale.domain().filter(function (d, i) {
            return !(i % (barData.length / 10));
        }));

    var hGuide = d3.select('svg').append('g');
    hAxis(hGuide);
    hGuide.attr('transform', 'translate(' + margin.left + ', ' + (height + margin.top) + ')');
    hGuide.selectAll('path')
        .style({fill: 'none', stroke: "#000"});
    hGuide.selectAll('line')
        .style({stroke: "#000"});


}


function render_shortages_chart(data, id) {
    var bardata = unpack.shortages(data, 'chart');
    var nums = [];
    var switchColor;

    for (i in bardata) {
        nums.push(bardata[i][1]);
    }

    var tooltip = d3.select('body')
        .append('div')
        .style('position', 'absolute')
        .style('background', 'white')
        .style('padding', '0 10px')
        .style('opacity', 0);

    //console.log(nums);

    var margin = {top: 30, right: 50, bottom: 40, left: 95};

    var height = 400 - margin.top - margin.bottom;
    var width = 600 - margin.left - margin.right;

    var colors = d3.scale.linear()
        .domain([0, nums.length * .33, nums.length * .66, nums.length])
        .range(['white', '#259286', '#738A05', '#2176C7']);

    var yScale = d3.scale.linear()
        .domain([0, d3.max(nums)])
        .range([0, height]);

    var xScale = d3.scale.ordinal()
        .domain(d3.range(0, nums.length))
        .rangeBands([0, width], .2); // space the bars on the chart

    var shortage_chart = d3.select(id).append('svg')
        .style('background', '#0A2933;')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')') //moving the chart graphic
        .selectAll('rect').data(nums)
        .enter().append('rect')
        .style('fill', function (d, i) {
            return colors(i);
        })
        .attr('width', xScale.rangeBand())
        .attr('height', 0)
        .attr('x', function (d, i) {
            return xScale(i);
        })
        .attr('y', height).on('mouseover', function (d) {
            //console.log(d);
            tooltip.transition()
                .style('opacity', 0.5);
            tooltip.html(d)
                .style('left', (d3.event.pageX - 35) + 'px')
                .style('top', (d3.event.pageY - 30) + 'px');

            switchColor = this.style.fill;
            d3.select(this)
                .style('opacity', .5);
            d3.select(this)
                .style('fill', '#D11C24')

        }).on('mouseout', function (d) {
            d3.select(this)
                .transition()
                .delay(300)
                .duration(300)
                .style('fill', switchColor);
            d3.select(this)
                .style('opacity', 1)
        });
    //transitions graph in
    shortage_chart.transition()
        .attr('height', function (d, i) {
            return yScale(d);
        })
        .attr('y', function (d) {
            return height - yScale(d);
        }).delay(function (d, i) {
        return i * 70;

    }).ease('elastic');

    var vGuideScale = d3.scale.linear()
        .domain([0, d3.max(nums)])
        .range([height, 0]); //reversing the order of the scale on the y axi

    var vAxis = d3.svg.axis()
        .scale(vGuideScale)
        .orient('left')
        .ticks(10);

    var vGuide = d3.select('#shortage-chart > svg').append('g');
    vAxis(vGuide);
    vGuide.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');
    vGuide.selectAll('path')
        .style({fill: 'none', stroke: "white"});
    vGuide.selectAll('line')
        .style({stroke: "white"});
    vGuide.selectAll('text')
        .style({stroke: "grey"});

    var name = d3.scale.ordinal()
        .range(['#259286', '#2176C7', '#FCF4DC', 'white', '#819090', '#A57706', '#EAE3CB', '#2e004d']);

    var hAxis = d3.svg.axis()
        .scale(xScale)
        .orient('bottom')
        .tickValues(xScale.domain().filter(function (d, i) {
            return !(i % (nums.length / 5));
        }));

    var hGuide = d3.select('#shortage-chart > svg').append('g');
    hAxis(hGuide);
    hGuide.attr('transform', 'translate(' + margin.left + ', ' + (height + margin.top) + ')');
    hGuide.selectAll('path')
        .style({fill: 'none', stroke: "white"});
    hGuide.selectAll('line')
        .style({stroke: "white"});
    hGuide.selectAll('text')
        .style({stroke: "grey"});

}

function render_excess_chart(data, id) {
    var bardata = unpack.excess_cost(data, 'chart');
    //console.log(bardata);
    var nums = [];
    var switchColor;

    for (i in bardata) {
        nums.push(bardata[i][1]);
    }

    var tooltip = d3.select('body')
        .append('div')
        .style('position', 'absolute')
        .style('background', 'white')
        .style('padding', '0 10px')
        .style('opacity', 0);

    //console.log(nums);

    var margin = {top: 30, right: 50, bottom: 40, left: 95};

    var height = 400 - margin.top - margin.bottom;
    var width = 600 - margin.left - margin.right;

    var colors = d3.scale.linear()
        .domain([0, nums.length * .33, nums.length * .66, nums.length])
        .range(['white', '#259286', '#738A05', '#2176C7']);

    var yScale = d3.scale.linear()
        .domain([0, d3.max(nums)])
        .range([0, height]);

    var xScale = d3.scale.ordinal()
        .domain(d3.range(0, nums.length))
        .rangeBands([0, width], .2); // space the bars on the chart

    var shortage_chart = d3.select(id).append('svg')
        .style('background', '#0A2933;')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')') //moving the chart graphic
        .selectAll('rect').data(nums)
        .enter().append('rect')
        .style('fill', function (d, i) {
            return colors(i);
        })
        .attr('width', xScale.rangeBand())
        .attr('height', 0)
        .attr('x', function (d, i) {
            return xScale(i);
        })
        .attr('y', height).on('mouseover', function (d) {
            //console.log(d);
            tooltip.transition()
                .style('opacity', 0.5);
            tooltip.html(d)
                .style('left', (d3.event.pageX - 35) + 'px')
                .style('top', (d3.event.pageY - 30) + 'px');

            switchColor = this.style.fill;
            d3.select(this)
                .style('opacity', .5);
            d3.select(this)
                .style('fill', '#D11C24')

        }).on('mouseout', function (d) {
            d3.select(this)
                .transition()
                .delay(300)
                .duration(300)
                .style('fill', switchColor);
            d3.select(this)
                .style('opacity', 1)
        });
    //transitions graph in
    shortage_chart.transition()
        .attr('height', function (d, i) {
            return yScale(d);
        })
        .attr('y', function (d) {
            return height - yScale(d);
        }).delay(function (d, i) {
        return i * 70;

    }).ease('elastic');

    var vGuideScale = d3.scale.linear()
        .domain([0, d3.max(nums)])
        .range([height, 0]); //reversing the order of the scale on the y axi

    var vAxis = d3.svg.axis()
        .scale(vGuideScale)
        .orient('left')
        .ticks(10);

    var vGuide = d3.select('#excess-chart > svg').append('g');
    vAxis(vGuide);
    vGuide.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');
    vGuide.selectAll('path')
        .style({fill: 'none', stroke: "white"});
    vGuide.selectAll('line')
        .style({stroke: "white"});
    vGuide.selectAll('text')
        .style({stroke: "grey"});

    var name = d3.scale.ordinal()
        .range(['#259286', '#2176C7', '#FCF4DC', 'white', '#819090', '#A57706', '#EAE3CB', '#2e004d']);

    var hAxis = d3.svg.axis()
        .scale(xScale)
        .orient('bottom')
        .tickValues(xScale.domain().filter(function (d, i) {
            return !(i % (nums.length / 5));
        }));

    var hGuide = d3.select('#excess-chart > svg').append('g');
    hAxis(hGuide);
    hGuide.attr('transform', 'translate(' + margin.left + ', ' + (height + margin.top) + ')');
    hGuide.selectAll('path')
        .style({fill: 'none', stroke: "white"});
    hGuide.selectAll('line')
        .style({stroke: "white"});
    hGuide.selectAll('text')
        .style({stroke: "grey"});

}