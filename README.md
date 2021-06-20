# LiteDashboard
A light-weight dashboard for monitoring computer hardware.

&nbsp;

### To run as a container:
```
$ sudo docker run \
> --name litedashboard -d \
> -e NODE_NAME=$(hostname) \
> -e IP_ADDRESS=$(hostname -I | awk '{print $1}') \
> -p 5000:5000 carcaral47/litedashboard:<tag>
```
