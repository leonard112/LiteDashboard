let cpu_usage_data = [];
let cpu_temperature_data = [];
let memory_usage_data = [];
let swap_usage_data = [];
let disk_usage_data = [];
let universal_x_values = [];

function prune_datasets() {
    let dataset_size = parseInt($("#time-range").val())
    while (cpu_usage_data.length > dataset_size && dataset_size != -1) {
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
        for (element_id of element_ids) $(element_id).css({color: "white", opacity: 0.6});
        render_chart(chart_id, data, y_max, "#777");
    }
}

function color_cpu_temperature_and_update_chart() {
    let cpu_temperature = $("#cpu-temperature").text();
    if (cpu_temperature != "N/A")
        cpu_temperature_data.push(parseFloat(cpu_temperature.substring(0, cpu_temperature.length - 3)));
    else cpu_temperature_data.push(null);
    color_and_render(["#cpu-temperature"], "cpu-temperature-chart", cpu_temperature, 3, 70, 80, 
                     cpu_temperature_data, 120);
}

function color_cpu_usage_and_update_chart() {
    let cpu_usage = $("#cpu-usage").text();
    if (cpu_usage != "N/A")
        cpu_usage_data.push(parseFloat(cpu_usage.substring(0, cpu_usage.length - 2)));
    else cpu_usage_data.push(null);
    color_and_render(["#cpu-usage"], "cpu-usage-chart", cpu_usage, 2, 75, 90, 
                     cpu_usage_data, 100);
}

function color_memory_usage_and_update_chart(used_memory_percent) {
    if (used_memory_percent != "N/A") memory_usage_data.push(used_memory_percent);
    else memory_usage_data.push(null);
    color_and_render(["#used-memory", "#free-memory"], "memory-usage-chart", used_memory_percent, null, 75, 90, 
                     memory_usage_data, 100);
}

function color_swap_usage_and_update_chart(used_swap_percent) {
    if (used_swap_percent != "N/A") swap_usage_data.push(used_swap_percent);
    else swap_usage_data.push(null);
    color_and_render(["#used-swap", "#free-swap"], "swap-usage-chart", used_swap_percent, null, 75, 90, 
                     swap_usage_data, 100);
}

function color_disk_usage_and_update_chart(used_disk_percent) {
    if (used_disk_percent != "N/A") disk_usage_data.push(used_disk_percent);
    else disk_usage_data.push(null);
    color_and_render(["#used-disk", "#free-disk"], "disk-usage-chart", used_disk_percent, null, 75, 90, 
                     disk_usage_data, 100);
}

function destroy_all_charts() {
    Chart.helpers.each(Chart.instances, function(instance){
        instance.destroy();
    });
}

function render_chart(id, cpu_usage_array, y_max, color) {
    let graph_text = universal_x_values[0] + " - " + universal_x_values.slice(-1)[0];
    fill_color = ""
    if (color == "#777") {
        graph_text = "N/A";
        fill_color = "rgba(119, 119, 119, 0.05)";
    }
    else if (color == "green") fill_color = "rgba(0, 255, 0, 0.05)";
    else if (color == "yellow") fill_color = "rgba(255, 255, 0, 0.05)";
    else if (color == "red") fill_color = "rgba(255, 0, 0, 0.05)";
    grid_color = '#333'
    new Chart(id, {
      type: "line",
      data: {
        labels: universal_x_values,
        datasets: [{ 
            label: graph_text,
            data: cpu_usage_array,
            borderColor: color,
            backgroundColor: fill_color,
            borderWidth: 1,
            fill: true
        }]
      },
      options: {
        animation: {
            duration: 0
        },
        elements: {
            point:{
                backgroundColor: color,
                radius: 2
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
                ticks: { display: false },
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
    });
}

universal_x_values.push(new Date().toLocaleString());
color_cpu_usage_and_update_chart();
color_cpu_temperature_and_update_chart();
color_memory_usage_and_update_chart(parseFloat($("#used-memory-percent").text()));
color_swap_usage_and_update_chart(parseFloat($("#used-swap-percent").text()));
color_disk_usage_and_update_chart(parseFloat($("#used-disk-percent").text()));


$("body").show();

let xhttp = new XMLHttpRequest();
setInterval(function(){ 
    xhttp.onreadystatechange = function() {
        scroll_position = $('html').scrollTop()
        if (this.readyState == 4) {
            prune_datasets();
            universal_x_values.push(new Date().toLocaleString());
            destroy_all_charts();
        }
        if (this.readyState == 4 && this.status == 200) {
            dynamic_values = JSON.parse(this.responseText);
            $("#uptime").text(dynamic_values.uptime);
            $("#uptime").css({opacity: 1});
            $("#cpu-speed-current").text(dynamic_values.cpu_speed_current);
            $("#cpu-speed-current").css({opacity: 1});
            $("#cpu-usage").text(dynamic_values.cpu_usage);
            $("#cpu-temperature").text(dynamic_values.cpu_temperature);
            color_cpu_usage_and_update_chart()
            color_cpu_temperature_and_update_chart()
            $("#used-memory-amount").text(dynamic_values.used_memory);
            $("#used-memory-percent").text(dynamic_values.used_memory_percent);
            $("#free-memory-amount").text(dynamic_values.free_memory);
            $("#free-memory-percent").text(dynamic_values.free_memory_percent);
            color_memory_usage_and_update_chart(parseFloat(dynamic_values.used_memory_percent));
            $("#used-swap-amount").text(dynamic_values.used_swap);
            $("#used-swap-percent").text(dynamic_values.used_swap_percent);
            $("#free-swap-amount").text(dynamic_values.free_swap);
            $("#free-swap-percent").text(dynamic_values.free_swap_percent);
            color_swap_usage_and_update_chart(parseFloat(dynamic_values.used_swap_percent));
            $("#used-disk-amount").text(dynamic_values.used_disk);
            $("#used-disk-percent").text(dynamic_values.used_disk_percent);
            $("#free-disk-amount").text(dynamic_values.free_disk);
            $("#free-disk-percent").text(dynamic_values.free_disk_percent);
            color_disk_usage_and_update_chart(parseFloat(dynamic_values.used_disk_percent));
            $("#bytes-sent").text(dynamic_values.bytes_sent);
            $("#bytes-sent").css({opacity: 1});
            $("#bytes-recieved").text(dynamic_values.bytes_recieved);
            $("#bytes-recieved").css({opacity: 1});
            $("#packets-sent").text(dynamic_values.packets_sent);
            $("#packets-recieved").text(dynamic_values.packets_recieved);
        }
        else if (this.readyState == 4){
            $("#uptime").text("N/A");
            $("#uptime").css({opacity: 0.6});
            $("#cpu-speed-current").text("N/A");
            $("#cpu-speed-current").css({opacity: 0.6});
            $("#cpu-usage").text("N/A");
            $("#cpu-temperature").text("N/A");
            color_cpu_usage_and_update_chart()
            color_cpu_temperature_and_update_chart()
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
        }
        $('html').scrollTop(scroll_position)
    };
    xhttp.open("GET", "dynamic_data", true);
    xhttp.send();}, 
5000);