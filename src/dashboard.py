from flask import Flask, render_template
import datetime
import time
import socket
import platform
import psutil

app = Flask(__name__)


def get_uptime():
    uptime = time.time() - psutil.boot_time()
    years = int(uptime/31557600)
    months = int(uptime%31557600/2629800)
    weeks = int(uptime%31557600%2629800/604800)
    days = int(uptime%31557600%2629800%604800/86400)
    hours = int(uptime%31557600%2629800%604800%86400/3600)
    minutes = int(uptime%31557600%2629800%604800%86400%3600/60)
    seconds = int(uptime%31557600%2629800%604800%86400%3600%60)
    if uptime >= 31557600: 
        return f"{years} Years {months} Months {weeks} Weeks {days} Days {hours} Hours {minutes} Minutes {seconds} Seconds"
    elif uptime >= 2629800: 
        return f"{months} Months {weeks} Weeks {days} Days {hours} Hours {minutes} Minutes {seconds} Seconds"
    elif uptime >= 604800:
        return f"{weeks} Weeks {days} Days {hours} Hours {minutes} Minutes {seconds} Seconds"
    elif uptime >= 86400:
        return f"{days} Days {hours} Hours {minutes} Minutes {seconds} Seconds"
    elif uptime >= 3600:
        return f"{hours} Hours {minutes} Minutes {seconds} Seconds"
    elif uptime >= 60: 
        return f"{minutes} Minutes {seconds} Seconds"
    return f"{seconds} Seconds"


def get_cpu_speed(cpu_speed):
    if cpu_speed >= 1000: return str(round(cpu_speed/1000, 2)) + " GHz"
    return str(round(cpu_speed, 2)) + " MHz"


def convert_units(bytes):
    if bytes >= 1000000000000: return str(round(bytes/1000000000000, 2)) + " TB"
    if bytes >= 1000000000: return str(round(bytes/1000000000, 2)) + " GB"
    if bytes >= 1000000: return str(round(bytes/1000000, 2)) + " MB"
    if bytes >= 1000: return str(round(bytes/1000, 2)) + " KB"
    return str(bytes) + " bytes"


@app.route("/")
def index():
    sys_info = platform.uname()
    return render_template(
        'index.html', 
        system_name=sys_info.node, 
        uptime=get_uptime(),
        os=sys_info.system, 
        os_version=sys_info.version,
        cpu=sys_info.processor,
        cpu_arch=sys_info.machine,
        cpu_cores=psutil.cpu_count(logical=False),
        logical_processors=psutil.cpu_count(),
        cpu_usage=psutil.cpu_percent(1),
        cpu_speed_current=get_cpu_speed(psutil.cpu_freq().current),
        cpu_speed_minimum=get_cpu_speed(psutil.cpu_freq().min),
        cpu_speed_maximum=get_cpu_speed(psutil.cpu_freq().max),
        total_memory=convert_units(psutil.virtual_memory().total),
        used_memory=convert_units(psutil.virtual_memory().used),
        used_memory_percent=psutil.virtual_memory().percent,
        free_memory=convert_units(psutil.virtual_memory().free),
        free_memory_percent=(100 - psutil.virtual_memory().percent),
        total_swap=convert_units(psutil.swap_memory().total),
        used_swap=convert_units(psutil.swap_memory().used),
        used_swap_percent=psutil.swap_memory().percent,
        free_swap=convert_units(psutil.swap_memory().free),
        free_swap_percent=(100 - psutil.swap_memory().percent),
        storage_mount_point=psutil.disk_partitions()[0].mountpoint,
        file_system_type=psutil.disk_partitions()[0].fstype,
        total_disk=convert_units(psutil.disk_usage('/').total),
        used_disk=convert_units(psutil.disk_usage('/').used),
        used_disk_percent=psutil.disk_usage('/').percent,
        free_disk=convert_units(psutil.disk_usage('/').free),
        free_disk_percent=(100 - psutil.disk_usage('/').percent),
        ip_address=socket.gethostbyname(socket.gethostname()),
        data_sent=convert_units(psutil.net_io_counters().bytes_sent),
        data_recieved=convert_units(psutil.net_io_counters().bytes_recv),
        packets_sent=psutil.net_io_counters().packets_sent,
        packets_recieved=psutil.net_io_counters().packets_recv,
        year=datetime.datetime.now().year)


@app.route("/dynamic_data")
def memory_usage():
    return {
                "uptime": get_uptime(),
                "cpu_speed_current": get_cpu_speed(psutil.cpu_freq().current),
                "cpu_usage": str(psutil.cpu_percent(1)) + " %",
                "used_memory": convert_units(psutil.virtual_memory().used),
                "used_memory_percent": str(psutil.virtual_memory().percent),
                "free_memory": convert_units(psutil.virtual_memory().free),
                "free_memory_percent": str((100 - psutil.virtual_memory().percent)),
                "used_swap": convert_units(psutil.swap_memory().used),
                "used_swap_percent": str(psutil.swap_memory().percent),
                "free_swap": convert_units(psutil.swap_memory().free),
                "free_swap_percent": str((100 - psutil.swap_memory().percent)),
                "used_disk": convert_units(psutil.disk_usage('/').used),
                "used_disk_percent": str(psutil.disk_usage('/').percent),
                "free_disk": convert_units(psutil.disk_usage('/').free),
                "free_disk_percent": str((100 - psutil.disk_usage('/').percent)),
                "data_sent": convert_units(psutil.net_io_counters().bytes_sent),
                "data_recieved": convert_units(psutil.net_io_counters().bytes_recv),
                "packets_sent": psutil.net_io_counters().packets_sent,
                "packets_recieved": psutil.net_io_counters().packets_recv
            }


if __name__ == "__main__":
    app.run()