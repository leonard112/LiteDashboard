from flask import Flask, render_template
import sys
from subprocess import run as shell
from datetime import datetime
from time import sleep, time
import socket
import platform
import psutil


NODE_NAME = None
IP_ADDRESS = None


app = Flask(__name__)


def timestamp():
    timestamp = datetime.now()
    month = timestamp.strftime("%m")
    day = timestamp.strftime("%d")
    year = timestamp.strftime("%Y")
    hour = timestamp.strftime("%I")
    minute = timestamp.strftime("%M")
    second = timestamp.strftime("%S")
    am_pm = timestamp.strftime("%p")
    return f"{month}/{day}/{year}, {hour}:{minute}:{second} {am_pm}"


def format_label(value, plural_label):
    if value == 1:
        return plural_label[:-1]
    return plural_label


def get_uptime():
    uptime = time() - psutil.boot_time()
    seconds_label = "Seconds"
    years = int(uptime / 31557600)
    years_label = format_label(years, "Years")
    months = int(uptime % 31557600 / 2629800)
    months_label = format_label(months, "Months")
    weeks = int(uptime % 31557600 % 2629800 / 604800)
    weeks_label = format_label(weeks, "Weeks")
    days = int(uptime % 31557600 % 2629800 % 604800 / 86400)
    days_label = format_label(days, "Days")
    hours = int(uptime % 31557600 % 2629800 % 604800 % 86400 / 3600)
    hours_label = format_label(hours, "Hours")
    minutes = int(uptime % 31557600 % 2629800 % 604800 % 86400 % 3600 / 60)
    minutes_label = format_label(minutes, "Minutes")
    seconds = int(uptime % 31557600 % 2629800 % 604800 % 86400 % 3600 % 60)
    seconds_label = format_label(seconds, "Seconds")
    formatted_uptime = f"{seconds} {seconds_label}"
    if uptime >= 60:
        formatted_uptime = f"{minutes} {minutes_label}, {formatted_uptime}"
    if uptime >= 3600:
        formatted_uptime = f"{hours} {hours_label}, {formatted_uptime}"
    if uptime >= 86400:
        formatted_uptime = f"{days} {days_label}, {formatted_uptime}"
    if uptime >= 604800:
        formatted_uptime = f"{weeks} {weeks_label}, {formatted_uptime}"
    if uptime >= 2629800:
        formatted_uptime = f"{months} {months_label}, {formatted_uptime}"
    if uptime >= 31557600:
        formatted_uptime = f"{years} {years_label}, {formatted_uptime}"
    return formatted_uptime


def get_node_name():
    if NODE_NAME is not None:
        return NODE_NAME
    return platform.uname().node


def get_cpu():
    processor = platform.uname().processor
    if processor == '' or processor == platform.uname().machine:
        output = shell(
            'lscpu | grep "Model name:" | awk "{print $2}"',
            capture_output=True,
            text=True,
            shell=True)
        return output.stdout.split("Model name:")[-1]
    return processor


def get_cpu_speed(cpu_speed):
    if cpu_speed >= 1000:
        return str(round(cpu_speed / 1000, 2)) + " GHz"
    return str(round(cpu_speed, 2)) + " MHz"


def get_average_cpu_temperature():
    try:
        try:
            cpu_core_temperatures = psutil.sensors_temperatures()['coretemp']
        except BaseException:
            cpu_core_temperatures = psutil.sensors_temperatures()[
                'cpu_thermal']
        cpu_core_temperatures_sum = 0
        for cpu_core_temperature in cpu_core_temperatures:
            cpu_core_temperatures_sum += cpu_core_temperature.current
        return round(cpu_core_temperatures_sum / len(cpu_core_temperatures), 2)
    except BaseException:
        return "N/A"


def get_percent(used, total):
    try:
        return (used / total) * 100
    except ZeroDivisionError:
        return 0


def get_memory_usage_percent():
    return get_percent(
        psutil.virtual_memory().used,
        psutil.virtual_memory().total)


def get_swap_usage_percent():
    return get_percent(
        psutil.swap_memory().used,
        psutil.swap_memory().total)


def get_disk_usage_percent():
    return get_percent(
        psutil.disk_usage('/').used,
        psutil.disk_usage('/').total)


# https://stackoverflow.com/questions/166506/finding-local-ip-addresses-using-pythons-stdlib
def get_ip_address():
    if IP_ADDRESS is not None:
        return IP_ADDRESS
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip_address = s.getsockname()[0]
        s.close()
        return ip_address
    except BaseException:
        return socket.gethostbyname(socket.gethostname())


def convert_units(bytes):
    if bytes >= 1000000000000:
        return str(round(bytes / 1000000000000, 2)) + " TB"
    if bytes >= 1000000000:
        return str(round(bytes / 1000000000, 2)) + " GB"
    if bytes >= 1000000:
        return str(round(bytes / 1000000, 2)) + " MB"
    if bytes >= 1000:
        return str(round(bytes / 1000, 2)) + " KB"
    return str(bytes) + " bytes"


@app.route("/")
def index():
    return render_template(
        'index.html',
        node_name=get_node_name(),
        uptime=get_uptime(),
        os=platform.uname().system,
        os_version=platform.uname().version,
        cpu=get_cpu(),
        cpu_arch=platform.uname().machine,
        cpu_cores=psutil.cpu_count(logical=False),
        logical_processors=psutil.cpu_count(),
        cpu_speed_current=get_cpu_speed(psutil.cpu_freq().current),
        cpu_speed_minimum=get_cpu_speed(psutil.cpu_freq().min),
        cpu_speed_maximum=get_cpu_speed(psutil.cpu_freq().max),
        cpu_temperature=get_average_cpu_temperature(),
        cpu_usage=psutil.cpu_percent(),
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
        storage_device=psutil.disk_partitions()[0].device,
        file_system_type=psutil.disk_partitions()[0].fstype,
        total_disk=convert_units(psutil.disk_usage('/').total),
        used_disk=convert_units(psutil.disk_usage('/').used),
        used_disk_percent=psutil.disk_usage('/').percent,
        free_disk=convert_units(psutil.disk_usage('/').free),
        free_disk_percent=(100 - psutil.disk_usage('/').percent),
        ip_address=get_ip_address(),
        bytes_sent=convert_units(psutil.net_io_counters().bytes_sent),
        bytes_recieved=convert_units(psutil.net_io_counters().bytes_recv),
        packets_sent=psutil.net_io_counters().packets_sent,
        packets_recieved=psutil.net_io_counters().packets_recv,
        year=datetime.now().year)


@app.route("/dynamic_data")
def memory_usage():
    payload = []
    for i in range(5):
        data = {
            "cpu_usage": psutil.cpu_percent(),
            "timestamp": timestamp(),
            "uptime": get_uptime(),
            "cpu_speed_current": get_cpu_speed(psutil.cpu_freq().current),
            "cpu_temperature": get_average_cpu_temperature(),
            "used_memory": convert_units(psutil.virtual_memory().used),
            "used_memory_percent": get_memory_usage_percent(),
            "free_memory": convert_units(psutil.virtual_memory().free),
            "used_swap": convert_units(psutil.swap_memory().used),
            "used_swap_percent": get_swap_usage_percent(),
            "free_swap": convert_units(psutil.swap_memory().free),
            "used_disk": convert_units(psutil.disk_usage('/').used),
            "used_disk_percent": get_disk_usage_percent(),
            "free_disk": convert_units(psutil.disk_usage('/').free),
            "bytes_sent": convert_units(psutil.net_io_counters().bytes_sent),
            "bytes_recieved": convert_units(psutil.net_io_counters().bytes_recv),
            "packets_sent": psutil.net_io_counters().packets_sent,
            "packets_recieved": psutil.net_io_counters().packets_recv
        }
        payload.append(data)
        sleep(.2)
    print("Sending payload.")
    return {"payload": payload}


if __name__ == "__main__":
    if len(sys.argv) >= 3:
        NODE_NAME = sys.argv[1]
        IP_ADDRESS = sys.argv[2]
    app.run(host='0.0.0.0')
