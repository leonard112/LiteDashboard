let uptime = null;
let cpu_frequency = null;
let used_memory = null;
let free_memory = null;
let used_swap = null;
let free_swap = null;
let used_disk = null;
let free_disk = null;
let bytes_sent = null;
let bytes_recieved = null;
let packets_sent = null;
let packets_recieved = null;
let data_set_size = 300;
let cpu_usage_data = [];
let cpu_temperature_data = [];
let memory_usage_data = [];
let swap_usage_data = [];
let disk_usage_data = [];
let x_axis = new Array(120).fill(null);
let universal_x_values = [];
let charts = {};

function clear_data_sets() {
    cpu_usage_data = [];
    cpu_temperature_data = [];
    memory_usage_data = [];
    swap_usage_data = [];
    disk_usage_data = [];
    universal_x_values = [];
}

function prune_data_sets() {
    let data_set_size = parseInt($("#time-range").val())
    while (cpu_usage_data.length > data_set_size && data_set_size != -1) {
        cpu_usage_data.shift();
        cpu_temperature_data.shift();
        memory_usage_data.shift();
        swap_usage_data.shift();
        disk_usage_data.shift();
        universal_x_values.shift();
    }
}

function get_color(percent, high, very_high) {
    if (percent <= high)
        return "green";
    else if (percent<= very_high)
        return "yellow";
    return "red";
}

function color_and_render(element_ids, chart_id, data_element, unit_offset, high_value, very_high_value, 
                          data, y_max) {
    if (data_element != "N/A") {
        if (unit_offset != null)
            data_element = parseFloat(data_element.substring(0, data_element.length - unit_offset));
        color = get_color(data_element, high_value, very_high_value);
        for (element_id of element_ids) $(element_id).css({color: color, opacity: 1});
        render_chart(chart_id, data, y_max, color);
    }
    else {
        for (element_id of element_ids) $(element_id).css({color: "white", opacity: .6});
        render_chart(chart_id, data, y_max, "#777");
    }
}

function color_cpu_temperature_and_update_chart(cpu_temperature) {
    color_and_render(["#cpu-temperature"], "cpu-temperature-chart", cpu_temperature, null, 70, 80, 
                     cpu_temperature_data, 120);
}

function color_cpu_usage_and_update_chart(cpu_usage) {
    color_and_render(["#cpu-usage"], "cpu-usage-chart", cpu_usage, null, 75, 90, 
                     cpu_usage_data, 100);
}

function color_memory_usage_and_update_chart(used_memory_percent) {
    color_and_render(["#used-memory", "#free-memory"], "memory-usage-chart", used_memory_percent, null, 75, 90, 
                     memory_usage_data, 100);
}

function color_swap_usage_and_update_chart(used_swap_percent) {
    color_and_render(["#used-swap", "#free-swap"], "swap-usage-chart", used_swap_percent, null, 75, 90, 
                     swap_usage_data, 100);
}

function color_disk_usage_and_update_chart(used_disk_percent) {
    color_and_render(["#used-disk", "#free-disk"], "disk-usage-chart", used_disk_percent, null, 75, 90, 
                     disk_usage_data, 100);
}

function render_chart(id, data_set, y_max, color) {
    let graph_text = universal_x_values[0] + " - " + universal_x_values.slice(-1)[0];
    let fill_color = ""
    if (color == "#777") {
        graph_text = "N/A";
        fill_color = "rgba(119, 119, 119, 0.05)";
    }
    else if (color == "green") fill_color = "rgba(0, 255, 0, 0.05)";
    else if (color == "yellow") fill_color = "rgba(255, 255, 0, 0.05)";
    else if (color == "red") fill_color = "rgba(255, 0, 0, 0.05)";
    grid_color = '#333'
    let data_set_size = parseInt($("#time-range").val())
    ticks = data_set_size/25
    if (data_set_size == 50)
        ticks = 10
    buffer = Array(data_set_size - data_set.length).fill("N/A")
    chart = {
      type: "line",
      data: {
        labels: universal_x_values.concat(buffer),
        datasets: [{ 
            label: graph_text,
            data: data_set.concat(buffer),
            borderColor: color,
            backgroundColor: fill_color,
            borderWidth: 1,
            fill: true,
            lineTension: .5
        }]
      },
      options: {
        animation: {
            duration: 0
        },
        elements: {
            point:{
                backgroundColor: color,
                radius: 0
            }
        },
        plugins: {
            title: {
                display: true,
                text: graph_text
            },
            legend: { display: false }
        },
        scales: {
            x: {
                ticks: { 
                    display: false,
                    maxTicksLimit: ticks
                },
                grid: { color: grid_color }
            },
            y: {
                max : y_max,    
                min : 0,
                ticks: { display: false },
                grid: { color: grid_color }
            },
            yAxes : {
                max : y_max,    
                min : 0,
                grid: { drawBorder: false }
            },
        }
      }
    }
    if (charts[id])
        charts[id].destroy();
    charts[id] = new Chart(id, chart);
    maximum_value = Math.max(...data_set);
    if (!isNaN(maximum_value)) {
        if (maximum_value < y_max)
            y_max = maximum_value;
    }
    minimum_value = Math.min(...data_set);
    if (!isNaN(minimum_value)) {
        if (minimum_value < 0)
            y_min = 0;
        else
            y_min = minimum_value;
    }
    if (y_min == y_max) {
        y_max += 1;
        y_min -= 1;
        if (y_min < 0)
            y_min = 0;
    }
    if (maximum_value == Number.NEGATIVE_INFINITY)
        y_max = 1;
    if (minimum_value == Number.POSITIVE_INFINITY)
        y_min = 0;
    chart.options.scales.y.max = y_max;
    chart.options.scales.yAxes.max = y_max;
    chart.options.scales.y.min = y_min;
    chart.options.scales.yAxes.min = y_min;
    id = id + "-scaled"
    if (charts[id])
        charts[id].destroy();
    charts[id] = new Chart(id, chart);
}

prune_data_sets();
universal_x_values.push(new Date().toLocaleString());
cpu_usage = $("#cpu-usage").text();
cpu_usage = parseFloat(cpu_usage.substring(0, cpu_usage.length-2));
cpu_usage_data.push(cpu_usage)
color_cpu_usage_and_update_chart(cpu_usage_data.at(-1));
cpu_temperature = $("#cpu-temperature").text();
if (cpu_temperature != "N/A")
    cpu_temperature = parseFloat(cpu_temperature.substring(0, cpu_temperature.length-3));
cpu_temperature_data.push(cpu_temperature);
color_cpu_temperature_and_update_chart(cpu_temperature_data.at(-1));
memory_usage_data.push(parseFloat($("#used-memory-percent").text()))
color_memory_usage_and_update_chart(memory_usage_data.at(-1));
swap_usage_data.push(parseFloat($("#used-swap-percent").text()))
color_swap_usage_and_update_chart(swap_usage_data.at(-1));
disk_usage_data.push(parseFloat($("#used-disk-percent").text()))
color_disk_usage_and_update_chart(disk_usage_data.at(-1));


$("body").show();

refresh();

function set_values(dynamic_values) {
    universal_x_values.push(dynamic_values.timestamp); 
    uptime = dynamic_values.uptime;
    cpu_frequency = dynamic_values.cpu_speed_current;
    cpu_usage_data.push(dynamic_values.cpu_usage);
    cpu_temperature_data.push(dynamic_values.cpu_temperature);
    memory_usage_data.push(dynamic_values.used_memory_percent);
    used_memory = dynamic_values.used_memory;
    free_memory = dynamic_values.free_memory;
    swap_usage_data.push(dynamic_values.used_swap_percent);
    used_swap = dynamic_values.used_swap;
    free_swap = dynamic_values.free_swap;
    disk_usage_data.push(dynamic_values.used_disk_percent);
    used_disk = dynamic_values.used_disk;
    free_disk = dynamic_values.free_disk;
    bytes_sent = dynamic_values.bytes_sent;
    bytes_recieved = dynamic_values.bytes_recieved;
    packets_sent = dynamic_values.packets_sent;
    packets_recieved = dynamic_values.packets_recieved;
}

async function refresh() {
    while(true) {
        try {
            let response = await fetch("/dynamic_data");
            let response_json = await response.json();
            $("#error").css({display: "none"});
            payload = response_json.payload;
            payload.forEach(set_values);
            prune_data_sets();
            $("html").height($("html").height()) 
            $("#uptime").text(uptime);
            $("#uptime").css({opacity: 1});
            $("#cpu-speed-current").text(cpu_frequency);
            $("#cpu-speed-current").css({opacity: 1});
            $("#cpu-usage").text(cpu_usage_data.at(-1) + " %");
            if (cpu_temperature_data.at(-1) == "N/A")
                $("#cpu-temperature").text(cpu_temperature_data.at(-1));
            else
                $("#cpu-temperature").text(cpu_temperature_data.at(-1) + " °C");
            color_cpu_usage_and_update_chart(cpu_usage_data.at(-1))
            color_cpu_temperature_and_update_chart(cpu_temperature_data.at(-1));
            $("#used-memory-amount").text(used_memory);
            memory_usage_percent = memory_usage_data.at(-1).toFixed(1);
            $("#used-memory-percent").text(memory_usage_percent + " %");
            $("#free-memory-amount").text(free_memory);
            $("#free-memory-percent").text((100 - memory_usage_percent).toFixed(1) + " %");
            color_memory_usage_and_update_chart(swap_usage_data.at(-1));
            $("#used-swap-amount").text(used_swap);
            swap_usage_percent = swap_usage_data.at(-1).toFixed(1);
            $("#used-swap-percent").text(swap_usage_percent + " %");
            $("#free-swap-amount").text(free_swap);
            $("#free-swap-percent").text((100 - swap_usage_percent).toFixed(1) + " %");
            color_swap_usage_and_update_chart(swap_usage_data.at(-1));
            $("#used-disk-amount").text(used_disk);
            disk_usage_percent = disk_usage_data.at(-1).toFixed(1);
            $("#used-disk-percent").text(disk_usage_percent + " %");
            $("#free-disk-amount").text(free_disk);
            $("#free-disk-percent").text((100 - disk_usage_percent).toFixed(1) + " %");
            color_disk_usage_and_update_chart(disk_usage_data.at(-1));
            $("#bytes-sent").text(bytes_sent);
            $("#bytes-sent").css({opacity: 1});
            $("#bytes-recieved").text(bytes_recieved);
            $("#bytes-recieved").css({opacity: 1});
            $("#packets-sent").text(packets_sent + " Packets");
            $("#packets-recieved").text(packets_recieved + " Packets");
            $("html").height("auto") 
        }
        catch (error) {
            $("html").height($("html").height());
            $("#error").css({display: "block"});
            clear_data_sets();
            prune_data_sets();
            $("#uptime").text("N/A");
            $("#uptime").css({opacity: 0.6});
            $("#cpu-speed-current").text("N/A");
            $("#cpu-speed-current").css({opacity: 0.6});
            $("#cpu-usage").text("N/A");
            $("#cpu-temperature").text("N/A");
            color_cpu_usage_and_update_chart("N/A");
            color_cpu_temperature_and_update_chart("N/A");
            $("#used-memory-amount").text("N/A");
            $("#used-memory-percent").text("N/A");
            $("#free-memory-amount").text("N/A");
            $("#free-memory-percent").text("N/A");
            color_memory_usage_and_update_chart("N/A");
            $("#used-swap-amount").text("N/A");
            $("#used-swap-percent").text("N/A");
            $("#free-swap-amount").text("N/A");
            $("#free-swap-percent").text("N/A");
            color_swap_usage_and_update_chart("N/A");
            $("#used-disk-amount").text("N/A");
            $("#used-disk-percent").text("N/A");
            $("#free-disk-amount").text("N/A");
            $("#free-disk-percent").text("N/A");
            color_disk_usage_and_update_chart("N/A");
            $("#bytes-sent").text("N/A");
            $("#bytes-sent").css({opacity: 0.6});
            $("#bytes-recieved").text("N/A");
            $("#bytes-recieved").css({opacity: 0.6});
            $("#packets-sent").text("N/A");
            $("#packets-recieved").text("N/A");
            $("html").height("auto");
        }
    }
}