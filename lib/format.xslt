<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:xi="http://www.w3.org/2001/XInclude"
                xmlns:html="http://www.w3.org/1999/xhtml"
                version="1.0">

    <xsl:output method="html" version="5.0"
        doctype-public=""
        doctype-system=""
    />

    <xsl:param name="input"/>

    <xsl:variable name="doc" select="document($input)"/>

    <xsl:template match="node()|@*">
        <xsl:copy>
            <xsl:apply-templates select="node()|@*"/>
        </xsl:copy>
    </xsl:template>

    <!-- <xsl:template match="html:*[not(node())]">
        <xsl:copy>
            <xsl:apply-templates select="@*"/>
            <xsl:text> </xsl:text>
        </xsl:copy>
    </xsl:template> -->

    <xsl:template match="xi:include">
        <xsl:variable name="id" select="substring(@href,2)"/>
        <xsl:apply-templates select="$doc//*[@id=$id]/node()"/>
    </xsl:template>

</xsl:stylesheet>