FROM registry.access.redhat.com/rhscl/nodejs-8-rhel7:1-28


LABEL io.k8s.description="AZF RAWGraphs image" \
      io.k8s.display-name="AZF RAWGraphs image"

USER root

COPY ./ ./

RUN PATH=/opt/rh/rh-nodejs8/root/usr/bin:$PATH npm install -g bower

# Force log dans stdout/err plutot que fichier
#RUN ln -sf /dev/stdout /var/opt/rh/rh-nginx112/log/nginx/access.log \
#    && ln -sf /dev/stderr /var/opt/rh/rh-nginx112/log/nginx/error.log
# sinon mettre un volume persistant pour /var/opt/rh/rh-nginx112/log/

#RUN mv ./nginx.conf $NGINX_CONF_PATH

#RUN chown -R 1001:0 $HOME && chmod -R g+rw $HOME && chmod -R 775 $HOME/.config

STOPSIGNAL SIGTERM

USER 1001

RUN PATH=/opt/rh/rh-nodejs8/root/usr/bin:$PATH bower install 

CMD $STI_SCRIPTS_PATH/run
