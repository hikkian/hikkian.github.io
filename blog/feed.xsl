<?xml version="1.0" encoding="UTF-8"?>
<!-- Shows the RSS feed as a readable page in a browser. RSS readers ignore this file and read the feed as usual. -->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="robots" content="noindex"/>
        <title><xsl:value-of select="rss/channel/title"/> · RSS</title>
        <style>
          :root { color-scheme: dark; }
          body { margin: 0; background: #111312; color: #eef1ef; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; font-size: 17px; line-height: 1.6; }
          a { color: #7ee0c3; text-underline-offset: 0.22em; }
          .wrap { width: min(760px, 100% - 2 * clamp(20px, 4vw, 48px)); margin-inline: auto; }
          header { padding: 56px 0 28px; }
          h1 { margin: 0; font-size: clamp(2rem, 1.4rem + 2vw, 2.75rem); font-weight: 700; letter-spacing: -0.02em; line-height: 1.1; }
          .intro { margin: 18px 0 0; color: #eef1ef; }
          .how { margin: 24px 0 0; padding: 20px 22px; background: #1a1e1c; border-radius: 10px; }
          .how p { margin: 0; }
          .how p + p { margin-top: 10px; }
          .url { display: block; margin-top: 10px; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 14px; overflow-wrap: anywhere; color: #7ee0c3; }
          .items { list-style: none; margin: 24px 0 0; padding: 0 0 80px; display: grid; gap: 12px; }
          .items li { padding: 24px; background: #1a1e1c; border-radius: 10px; }
          .items time { display: block; font-size: 15px; color: #a2aaa6; }
          .items h2 { margin: 6px 0 0; font-size: 1.3rem; font-weight: 650; line-height: 1.25; }
          .items h2 a { text-decoration: none; color: #eef1ef; }
          .items h2 a:hover { color: #7ee0c3; }
          .items p { margin: 10px 0 0; color: #eef1ef; }
          .empty { color: #a2aaa6; }
        </style>
      </head>
      <body>
        <div class="wrap">
          <header>
            <h1><xsl:value-of select="rss/channel/title"/></h1>
            <p class="intro"><xsl:value-of select="rss/channel/description"/></p>
            <div class="how">
              <p>This is an RSS feed. To follow it, paste its address into an RSS reader.</p>
              <p>Это лента RSS. Чтобы подписаться, вставьте её адрес в RSS-читалку.</p>
              <code class="url"><xsl:value-of select="rss/channel/atom:link/@href" xmlns:atom="http://www.w3.org/2005/Atom"/></code>
            </div>
          </header>

          <ol class="items">
            <xsl:for-each select="rss/channel/item">
              <li>
                <time><xsl:value-of select="pubDate"/></time>
                <h2><a href="{link}"><xsl:value-of select="title"/></a></h2>
                <p><xsl:value-of select="description"/></p>
              </li>
            </xsl:for-each>
            <xsl:if test="not(rss/channel/item)">
              <li class="empty">No posts yet. · Пока нет записей.</li>
            </xsl:if>
          </ol>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
