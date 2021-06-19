cpu_usage_data = []
cpu_usage_data_x_values = []
memory_usage_data = []
memory_usage_data_x_values = []
swap_usage_data = []
swap_usage_data_x_values = []
disk_usage_data = []
disk_usage_data_x_values = []

function prune_datasets() {
    dataset_size = parseInt($("#dataset-size").val())
    while (cpu_usage_data.length >= dataset_size && dataset_size != -1) {
        cpu_usage_data.shift()
        cpu_usage_data_x_values.shift()
        memory_usage_data.shift()
        memory_usage_data_x_values.shift()
        swap_usage_data.shift()
        swap_usage_data_x_values.shift()
        disk_usage_data.shift()
        disk_usage_data_x_values.shift()
    }
}

function get_color(percent) {
    if (percent <= 75)
        return "green"
    else if (percent <= 90)
        return "yellow"
    return "red"
}

function color_cpu_usage_and_update_chart() {
    cpu_usage = $("#cpu-usage").text()
    cpu_usage = parseFloat(cpu_usage.substring(0, cpu_usage.length -2))
    color = get_color(cpu_usage)
    $("#cpu-usage").css({color: color})
    cpu_usage_data.push(cpu_usage)
    cpu_usage_data_x_values.push("")
    render_chart("cpu-usage-chart", cpu_usage_data, cpu_usage_data_x_values, color)
}

function color_memory_usage_and_update_chart(used_memory_percent) {
    color = get_color(used_memory_percent)
    $("#used-memory").css({color: color})
    $("#free-memory").css({color: color})
    memory_usage_data.push(used_memory_percent)
    memory_usage_data_x_values.push("")
    render_chart("memory-usage-chart", memory_usage_data, memory_usage_data_x_values, color)
}

function color_swap_usage_and_update_chart(used_swap_percent) {
    color = get_color(used_swap_percent)
    $("#used-swap").css({color: color})
    $("#free-swap").css({color: color})
    swap_usage_data.push(used_swap_percent)
    swap_usage_data_x_values.push("")
    render_chart("swap-usage-chart", swap_usage_data, swap_usage_data_x_values, color)
}

function color_disk_usage_and_update_chart(used_disk_percent) {
    color = get_color(used_disk_percent)
    $("#used-disk").css({color: color})
    $("#free-disk").css({color: color})
    disk_usage_data.push(used_disk_percent)
    disk_usage_data_x_values.push("")
    render_chart("disk-usage-chart", disk_usage_data, disk_usage_data_x_values, color)
}

function render_chart(id, cpu_usage_array, x_values, color) {
    new Chart(id, {
      type: "line",
      data: {
        labels: x_values,
        datasets: [{ 
          data: cpu_usage_array,
          borderColor: color,
          fill: false
        }]
      },
      options: {
        legend: {display: false},
        scales: {
            yAxes : [{
                ticks : {
                    max : 100,    
                    min : 0
                }
            }]
        }
      }
    });
}


color_cpu_usage_and_update_chart();
color_memory_usage_and_update_chart(parseFloat($("#used-memory-percent").text()));
color_swap_usage_and_update_chart(parseFloat($("#used-swap-percent").text()));
color_disk_usage_and_update_chart(parseFloat($("#used-disk-percent").text()));


$("body").show();

var xhttp = new XMLHttpRequest();
setInterval(function(){ 
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            dynamic_values = JSON.parse(this.responseText);
            prune_datasets();
            $("#uptime").text(dynamic_values.uptime);
            $("#cpu-speed-current").text(dynamic_values.cpu_speed_current);
            $("#cpu-usage").text(dynamic_values.cpu_usage);
            color_cpu_usage_and_update_chart()
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
            $("#data-sent").text(dynamic_values.data_sent);
            $("#data-recieved").text(dynamic_values.data_recieved);
            $("#packets-sent").text(dynamic_values.packets_sent);
            $("#packets-recieved").text(dynamic_values.packets_recieved);
        }
    };
    xhttp.open("GET", "dynamic_data", true);
    xhttp.send();}, 
10000);