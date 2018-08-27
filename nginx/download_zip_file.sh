#

if [ -z "$VERSION" ]; then echo "Variable VERSION non definie, abandon"; exit 8; fi
if [ -z "$SOURCEURL" ]; then echo "Variable SOURCEURL non definie, abandon"; exit 8; fi
if [ -z "$SHA" ]; then echo "Variable SHA non definie, abandon"; exit 8; fi
if [ -z "$SHACMD" ]; then echo "Variable SHACMD non definie, abandon"; exit 8; fi
if [ -z "$TARGETD" ]; then echo "Variable TARGETD non definie, abandon"; exit 8; fi

TMPF=$(mktemp)
echo "curl -L -o ${TMPF} ${SOURCEURL}"
curl -L -o ${TMPF} ${SOURCEURL} 
[ $? -ne 0 ] && exit 8
echo "${SHA}  ${TMPF}" | ${SHACMD} -c - 
[ $? -ne 0 ] && exit 8
mkdir -p ${TARGETD}
echo "tar -xzf ${TMPF} -C ${TARGETD} --strip-components=1"
tar -xzf ${TMPF} -C ${TARGETD} --strip-components=1
[ $? -ne 0 ] && exit 8
rm -f ${TMPF}
