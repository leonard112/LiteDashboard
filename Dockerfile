FROM python:3.9

COPY src/ /home/LiteDashboard

RUN cd /home/LiteDashboard && pip install --use-feature=2020-resolver -r requirements.txt

EXPOSE 5000

WORKDIR /home/LiteDashboard
CMD python dashboard.py $NODE_NAME $IP_ADDRESS
