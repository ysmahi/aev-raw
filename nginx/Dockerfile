FROM registry.access.redhat.com/rhscl/nginx-112-rhel7:1-29

LABEL io.k8s.description="AZF RAWGraphs image" \
      io.k8s.display-name="AZF RAWGraphs image"

USER root

COPY ./ ./
RUN chmod 755 ./download_zip_file.sh 

#RUN yum-config-manager --enable rhel-server-rhscl-7-rpms \
#  &&  yum-config-manager --enable rhel-server-rhscl-8-rpms \
#  &&  yum-config-manager --enable rhel-7-server-optional-rpms \
#  &&  yum-config-manager --disable epel >/dev/null || : \
RUN  yum install -y git \
  &&  yum clean all -y

# Installe un ou des nodeJS
RUN VERSION="8.11.3" SHACMD=sha256sum SHA=1ea408e9a467ed4571730e160993f67a100e8c347f6f9891c9a83350df2bf2be \
    SOURCEURL=https://nodejs.org/dist/v${VERSION}/node-v${VERSION}-linux-x64.tar.gz \
    TARGETD=/usr/share/node-${VERSION} \
    ./download_zip_file.sh 

RUN VERSION="8.11.3" PATH=$PATH:/usr/share/node-${VERSION}/bin npm install -g bower

# Force log dans stdout/err plutot que fichier
RUN ln -sf /dev/stdout /var/opt/rh/rh-nginx112/log/nginx/access.log \
    && ln -sf /dev/stderr /var/opt/rh/rh-nginx112/log/nginx/error.log
# sinon mettre un volume persistant pour /var/opt/rh/rh-nginx112/log/

RUN mv ./nginx.conf $NGINX_CONF_PATH

RUN chown -R 1001:0 $HOME && chmod -R g+rw $HOME && chmod -R 775 $HOME/.config

STOPSIGNAL SIGTERM

USER 1001

RUN VERSION="8.11.3" PATH=$PATH:/usr/share/node-${VERSION}/bin bower install 


CMD $STI_SCRIPTS_PATH/run
