// src/documentos/documentos.controller.ts
import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  Param,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { DocumentosService } from './documentos.service';
import { Get, Query } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UnauthorizedException } from '@nestjs/common';

@Controller('documentos')
export class DocumentosController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly documentosService: DocumentosService,
  ) { }

  @Post(':idPaciente')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('documentos'))
  async uploadDocumentos(
    @Param('idPaciente', ParseIntPipe) idPaciente: number,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req,
  ) {
    console.log('🔹 POST recibido para guardar documentos. idPaciente:', idPaciente);
    console.log('🔹 Archivos recibidos:', files?.length || 0);
    console.log('👤 Usuario autenticado (req.user):', req.user);

    const idUsuario = Number(req.user?.id);

    if (!idUsuario) {
      console.error('❌ Error: idUsuario no encontrado en req.user. req.user es:', req.user);
      throw new UnauthorizedException('Usuario no autenticado (ID faltante)');
    }

    const urls = await this.uploadService.uploadFiles(
      files,
      `paciente-${idPaciente}`,
    );

    const documentos = files.map((file, index) => {
      const tipo = file.originalname.split('.')[0];
      return {
        tipo,
        url: urls[index],
      };
    });

    const esPendiente = req.body.es_pendiente === 'true';
    console.log('📌 esPendiente:', esPendiente);

    await this.documentosService.guardarDocumentos(
      idPaciente,
      idUsuario,
      documentos,
      esPendiente,
    );

    return {
      message: 'Documentos subidos y registrados en DB',
      urls,
    };
  }

  /* ---------- NUEVO: CONSULTA ---------- */
  /**
   * GET /documentos?cedula=1098765432      → por número de documento
   * GET /documentos?msd=MSD-001            → por número MSD
   * Si envías ambos, se aplica un OR.
   */
  @Get()
  async getDocumentos(
    @Query('cedula') cedula?: string,
    @Query('msd') msd?: string,
  ) {
    if (!cedula && !msd) {
      return { message: 'Debe enviar parámetro cedula o msd' };
    }
    return this.documentosService.buscarDocumentos({ cedula, msd });
  }
}
